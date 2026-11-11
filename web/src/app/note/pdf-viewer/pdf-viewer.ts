import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  ViewEncapsulation,
  untracked,
  viewChild,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';

export interface PdfPosition {
  page: number;
  total: number;
}

const WORKER_SRC = '/pdfjs/pdf.worker.min.mjs';
const BASE_WIDTH_REM = 52;

const toBytes = (dataUrl: string): Uint8Array =>
  Uint8Array.from(atob(dataUrl.split(',')[1] ?? ''), (char) => char.charCodeAt(0));

const startLoading = async (dataUrl: string): Promise<PDFDocumentLoadingTask> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  return pdfjs.getDocument({ data: toBytes(dataUrl) });
};

@Component({
  selector: 'app-pdf-viewer',
  host: { class: 'pdf-viewer' },
  encapsulation: ViewEncapsulation.None,
  template: `<div #pages class="pdf-viewer__pages d-flex flex-column align-items-center"></div>`,
  styles: `
    .pdf-viewer {
      display: flex;
      justify-content: safe center;
    }

    .pdf-viewer__pages {
      gap: 1rem;
    }

    .pdf-viewer__page {
      width: 100%;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 0.25rem;
      box-shadow: 0.375rem 0.375rem 0 rgba(var(--bs-dark-rgb), 0.18);

      canvas {
        display: block;
        width: 100%;
        height: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewer {
  readonly src = input.required<string>();
  readonly zoom = input(1);
  readonly initialPage = input(1);
  readonly positionChanged = output<PdfPosition>();

  private readonly pages = viewChild.required<ElementRef<HTMLElement>>('pages');
  #loadingTask: PDFDocumentLoadingTask | null = null;
  #document: PDFDocumentProxy | null = null;
  #observers: IntersectionObserver[] = [];
  #currentPage = 1;

  constructor() {
    effect(() => {
      const src = this.src();
      untracked(() => this.#open(src));
    });
    effect(() => {
      const zoom = this.zoom();
      untracked(() => this.#document && this.#layout(zoom, this.#currentPage));
    });
    inject(DestroyRef).onDestroy(() => {
      this.#disconnect();
      void this.#loadingTask?.destroy();
    });
  }

  async #open(src: string): Promise<void> {
    await this.#loadingTask?.destroy();
    this.#loadingTask = await startLoading(src);
    this.#document = await this.#loadingTask.promise;
    this.#currentPage = Math.min(this.initialPage(), this.#document.numPages);
    await this.#layout(this.zoom(), this.#currentPage);
  }

  async #layout(zoom: number, pageToShow: number): Promise<void> {
    const document = this.#document;
    if (!document) return;
    this.#disconnect();
    const container = this.pages().nativeElement;
    const firstPage = await document.getPage(1);
    const { width, height } = firstPage.getViewport({ scale: 1 });
    container.style.width = `min(${BASE_WIDTH_REM * zoom}rem, ${100 * zoom}%)`;
    container.replaceChildren(
      ...Array.from({ length: document.numPages }, (_, i) => {
        const page = globalThis.document.createElement('div');
        page.className = 'pdf-viewer__page';
        page.dataset['page'] = String(i + 1);
        page.style.aspectRatio = `${width} / ${height}`;
        return page;
      }),
    );
    const painted = new Set<number>();
    const painter = new IntersectionObserver(
      (entries) =>
        entries
          .filter(({ isIntersecting }) => isIntersecting)
          .forEach(({ target }) => this.#paint(target as HTMLElement, width, painted)),
      { rootMargin: '100% 0px' },
    );
    const tracker = new IntersectionObserver(
      (entries) =>
        entries
          .filter(({ isIntersecting }) => isIntersecting)
          .forEach(({ target }) => {
            this.#currentPage = Number((target as HTMLElement).dataset['page']);
            this.positionChanged.emit({ page: this.#currentPage, total: document.numPages });
          }),
      { rootMargin: '-50% 0px -50% 0px' },
    );
    this.#observers = [painter, tracker];
    container.querySelectorAll<HTMLElement>('.pdf-viewer__page').forEach((page) => {
      painter.observe(page);
      tracker.observe(page);
    });
    container.querySelector(`[data-page="${pageToShow}"]`)?.scrollIntoView({ block: 'start' });
    this.positionChanged.emit({ page: pageToShow, total: document.numPages });
  }

  async #paint(element: HTMLElement, baseWidth: number, painted: Set<number>): Promise<void> {
    const number = Number(element.dataset['page']);
    if (!this.#document || painted.has(number)) return;
    painted.add(number);
    const page = await this.#document.getPage(number);
    const viewport = page.getViewport({
      scale: (element.clientWidth / baseWidth) * devicePixelRatio,
    });
    const canvas = globalThis.document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    element.replaceChildren(canvas);
    await page.render({ canvas, viewport }).promise;
  }

  #disconnect(): void {
    this.#observers.forEach((observer) => observer.disconnect());
    this.#observers = [];
  }
}
