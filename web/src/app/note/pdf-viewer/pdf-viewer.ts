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
  computed,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import { PdfHighlight, PdfHighlightDraft } from '../../../common/models/syllabus.model';

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

const loadPdfjs = () => import('pdfjs-dist');

const toPercent = (value: number, size: number): number => (value / size) * 100;

export const startLoading = async (url: string): Promise<PDFDocumentLoadingTask> => {
  const pdfjs = await loadPdfjs();
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  return pdfjs.getDocument({ url });
};

@Component({
  selector: 'app-pdf-viewer',
  host: {
    class: 'pdf-viewer',
    '(document:selectionchange)': 'readSelection()',
    '(click)': 'openHighlightAt($event)',
  },
  encapsulation: ViewEncapsulation.None,
  template: `
    @let pdf = layout();
    <div class="pdf-viewer__pages d-flex flex-column align-items-center" [style.width]="pdf?.width">
      @for (key of pdf?.pageKeys ?? []; track key; let pageIndex = $index) {
        <div #page class="pdf-viewer__page" [style.aspect-ratio]="pdf?.aspectRatio">
          <canvas #canvas></canvas>
          <div class="pdf-viewer__highlights" aria-hidden="true">
            @for (highlight of highlightsByPage().get(pageIndex + 1); track highlight.id) {
              @for (rect of highlight.rects; track $index) {
                <span
                  class="pdf-viewer__highlight"
                  [class.pdf-viewer__highlight--noted]="highlight.note"
                  [style.--highlight-color]="'var(--bs-' + highlight.color + ')'"
                  [style.left.%]="rect.x"
                  [style.top.%]="rect.y"
                  [style.width.%]="rect.width"
                  [style.height.%]="rect.height"></span>
              }
            }
          </div>
          <div #textLayer class="textLayer"></div>
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
      position: relative;
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

      .pdf-viewer__highlights {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .pdf-viewer__highlight {
        position: absolute;
        background-color: color-mix(in srgb, var(--highlight-color) 45%, transparent);
        mix-blend-mode: multiply;
        border-radius: 0.125rem;
      }

      .pdf-viewer__highlight--noted {
        border-bottom: 2px solid var(--highlight-color);
      }

      .textLayer {
        position: absolute;
        inset: 0;
        overflow: clip;
        line-height: 1;
        text-align: initial;
        transform-origin: 0 0;
        --scale-round-x: 1px;
        --scale-round-y: 1px;
        --min-font-size: 1;
        --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
        --min-font-size-inv: calc(1 / var(--min-font-size));

        :is(span, br) {
          position: absolute;
          color: transparent;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }

        > :not(.markedContent),
        .markedContent span:not(.markedContent) {
          --font-height: 0;
          --scale-x: 1;
          --rotate: 0deg;
          font-size: calc(var(--text-scale-factor) * var(--font-height));
          transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
        }

        .markedContent {
          display: contents;
        }

        ::selection {
          color: transparent;
          background: rgba(var(--bs-primary-rgb), 0.3);
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewer {
  readonly src = input.required<string>();
  readonly zoom = input(1);
  readonly initialPage = input(1);
  readonly highlights = input<PdfHighlight[]>([]);
  readonly positionChanged = output<PdfPosition>();
  readonly selected = output<PdfHighlightDraft | null>();
  readonly highlightOpened = output<number>();

  protected readonly layout = signal<PdfLayout | null>(null);
  private readonly pages = viewChildren<ElementRef<HTMLElement>>('page');
  private readonly canvases = viewChildren<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly textLayers = viewChildren<ElementRef<HTMLElement>>('textLayer');
  readonly #injector = inject(Injector);
  protected readonly highlightsByPage = computed(() =>
    this.highlights().reduce(
      (pages, highlight) =>
        pages.set(highlight.page, [...(pages.get(highlight.page) ?? []), highlight]),
      new Map<number, PdfHighlight[]>(),
    ),
  );
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
    const textLayer = this.textLayers()[number - 1]?.nativeElement;
    if (!this.#document || !canvas || !textLayer || painted.has(number)) return;
    painted.add(number);
    const page = await this.#document.getPage(number);
    const scale = canvas.clientWidth / baseWidth;
    const viewport = page.getViewport({ scale: scale * devicePixelRatio });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, viewport }).promise;
    const { TextLayer } = await loadPdfjs();
    textLayer.style.setProperty('--total-scale-factor', String(scale));
    await new TextLayer({
      textContentSource: page.streamTextContent(),
      container: textLayer,
      viewport: page.getViewport({ scale }),
    }).render();
  }

  protected readSelection(): void {
    const selection = getSelection();
    const range = selection?.rangeCount && !selection.isCollapsed ? selection.getRangeAt(0) : null;
    const pageIndex = range
      ? this.pages().findIndex(({ nativeElement }) =>
          nativeElement.contains(range.commonAncestorContainer),
        )
      : -1;
    if (!range || pageIndex === -1) {
      this.selected.emit(null);
      return;
    }
    const page = this.pages()[pageIndex].nativeElement.getBoundingClientRect();
    this.selected.emit({
      page: pageIndex + 1,
      text: range.toString().trim(),
      rects: [...range.getClientRects()]
        .filter(({ width, height }) => width > 1 && height > 1)
        .map(({ left, top, width, height }) => ({
          x: toPercent(left - page.left, page.width),
          y: toPercent(top - page.top, page.height),
          width: toPercent(width, page.width),
          height: toPercent(height, page.height),
        })),
    });
  }

  protected openHighlightAt({ target, clientX, clientY }: MouseEvent): void {
    if (!getSelection()?.isCollapsed) return;
    const pageIndex = this.pages().findIndex(({ nativeElement }) =>
      nativeElement.contains(target as Node),
    );
    if (pageIndex === -1) return;
    const page = this.pages()[pageIndex].nativeElement.getBoundingClientRect();
    const x = toPercent(clientX - page.left, page.width);
    const y = toPercent(clientY - page.top, page.height);
    const highlight = this.highlightsByPage()
      .get(pageIndex + 1)
      ?.find(({ rects }) =>
        rects.some(
          (rect) =>
            x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height,
        ),
      );
    if (highlight) this.highlightOpened.emit(highlight.id);
  }

  #disconnect(): void {
    this.#observers.forEach((observer) => observer.disconnect());
    this.#observers = [];
  }
}
