import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  ViewEncapsulation,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';

export interface PdfPosition {
  page: number;
  total: number;
}

interface PdfLayout {
  width: string;
  aspectRatio: string;
  pageKeys: string[];
}

const WORKER_SRC = '/pdfjs/pdf.worker.min.mjs';
const BASE_WIDTH_REM = 52;

const toBytes = (dataUrl: string): Uint8Array =>
  Uint8Array.from(atob(dataUrl.split(',')[1] ?? ''), (char) => char.charCodeAt(0));

export const startLoading = async (dataUrl: string): Promise<PDFDocumentLoadingTask> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  return pdfjs.getDocument({ data: toBytes(dataUrl) });
};

@Component({
  selector: 'app-pdf-viewer',
  host: { class: 'pdf-viewer' },
  encapsulation: ViewEncapsulation.None,
  template: `
    @let pdf = layout();
    <div class="pdf-viewer__pages d-flex flex-column align-items-center" [style.width]="pdf?.width">
      @for (key of pdf?.pageKeys ?? []; track key) {
        <div #page class="pdf-viewer__page" [style.aspect-ratio]="pdf?.aspectRatio">
          <canvas #canvas></canvas>
        </div>
      }
    </div>
  `,
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

  protected readonly layout = signal<PdfLayout | null>(null);
  private readonly pages = viewChildren<ElementRef<HTMLElement>>('page');
  private readonly canvases = viewChildren<ElementRef<HTMLCanvasElement>>('canvas');
  readonly #injector = inject(Injector);
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
    const { width, height } = (await document.getPage(1)).getViewport({ scale: 1 });
    this.layout.set({
      width: `min(${BASE_WIDTH_REM * zoom}rem, ${100 * zoom}%)`,
      aspectRatio: `${width} / ${height}`,
      pageKeys: Array.from({ length: document.numPages }, (_, i) => `${zoom}-${i + 1}`),
    });
    afterNextRender(() => this.#observe(document, width, pageToShow), {
      injector: this.#injector,
    });
  }

  #observe(document: PDFDocumentProxy, baseWidth: number, pageToShow: number): void {
    const pages = this.pages().map(({ nativeElement }) => nativeElement);
    const numberOf = (target: Element): number => pages.indexOf(target as HTMLElement) + 1;
    const painted = new Set<number>();
    const painter = new IntersectionObserver(
      (entries) =>
        entries
          .filter(({ isIntersecting }) => isIntersecting)
          .forEach(({ target }) => this.#paint(numberOf(target), baseWidth, painted)),
      { rootMargin: '100% 0px' },
    );
    const tracker = new IntersectionObserver(
      (entries) =>
        entries
          .filter(({ isIntersecting }) => isIntersecting)
          .forEach(({ target }) => {
            this.#currentPage = numberOf(target);
            this.positionChanged.emit({ page: this.#currentPage, total: document.numPages });
          }),
      { rootMargin: '-50% 0px -50% 0px' },
    );
    this.#observers = [painter, tracker];
    pages.forEach((page) => {
      painter.observe(page);
      tracker.observe(page);
    });
    pages[pageToShow - 1]?.scrollIntoView({ block: 'start' });
    this.positionChanged.emit({ page: pageToShow, total: document.numPages });
  }

  async #paint(number: number, baseWidth: number, painted: Set<number>): Promise<void> {
    const canvas = this.canvases()[number - 1]?.nativeElement;
    if (!this.#document || !canvas || painted.has(number)) return;
    painted.add(number);
    const page = await this.#document.getPage(number);
    const viewport = page.getViewport({
      scale: (canvas.clientWidth / baseWidth) * devicePixelRatio,
    });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, viewport }).promise;
  }

  #disconnect(): void {
    this.#observers.forEach((observer) => observer.disconnect());
    this.#observers = [];
  }
}
