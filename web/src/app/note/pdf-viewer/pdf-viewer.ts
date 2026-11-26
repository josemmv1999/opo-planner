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
import {
  HighlightMark,
  HighlightUpdate,
  HighlightColor,
  InkMode,
  InkStroke,
  InkStrokeDraft,
  MarginNote,
  MarginNoteDraft,
  MarginNoteMove,
  MarginSide,
  PdfHighlight,
  PdfHighlightDraft,
} from '../../../common/models/syllabus.model';
import { AnnotationMenu } from '../annotation-menu/annotation-menu';
import { PdfInk } from '../pdf-ink/pdf-ink';
import { MarginNoteGrab, PdfMargin } from '../pdf-margin/pdf-margin';

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
const DRAG_THRESHOLD_PX = 4;

interface AnnotationPeek {
  kind: 'highlight' | 'margin';
  id: number;
}

interface PdfTooltip {
  page: number;
  text: string;
  top: number;
  left: number | null;
  right: number | null;
}

interface PdfMenu {
  page: number;
  above: number;
  below: number;
  left: number | null;
  right: number | null;
  highlight: PdfHighlight | null;
}

const MENU_MIN_TOP = 8;
const NO_STROKES: InkStroke[] = [];

const loadPdfjs = () => import('pdfjs-dist');

const toPercent = (value: number, size: number): number => (value / size) * 100;

export const startLoading = async (url: string): Promise<PDFDocumentLoadingTask> => {
  const pdfjs = await loadPdfjs();
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  return pdfjs.getDocument({ url });
};

@Component({
  selector: 'app-pdf-viewer',
  imports: [AnnotationMenu, PdfInk, PdfMargin],
  host: {
    class: 'pdf-viewer',
    '(document:selectionchange)': 'readSelection()',
    '(click)': 'openHighlightAt($event)',
    '(document:click)': 'closeTooltipOutside($event)',
    '(document:pointerdown)': 'forgetDrag()',
    '(document:pointermove)': 'dragMarginNote($event)',
    '(document:pointerup)': 'dropMarginNote()',
    '(document:pointercancel)': 'cancelMarginDrag()',
  },
  encapsulation: ViewEncapsulation.None,
  template: `
    @let pdf = layout();
    <div
      class="pdf-viewer__pages d-flex flex-column align-items-center"
      [style.width]="pdf?.width"
      [style.--pdf-zoom]="zoom()">
      @for (key of pdf?.pageKeys ?? []; track key; let pageIndex = $index) {
        <div class="pdf-viewer__row d-flex w-100">
          <app-pdf-margin
            side="left"
            [notes]="marginNotesOf(pageIndex + 1, 'left')"
            [hint]="marginHint()"
            (added)="addMarginNote({ page: pageIndex + 1, side: 'left', y: $event })"
            (opened)="openMarginNote($event)"
            (grabbed)="grabMarginNote(pageIndex + 1, $event)" />
          <div #page class="pdf-viewer__page" [style.aspect-ratio]="pdf?.aspectRatio">
            <canvas #canvas></canvas>
            <div class="pdf-viewer__highlights" aria-hidden="true">
              @for (highlight of highlightsByPage().get(pageIndex + 1); track highlight.id) {
                @for (rect of highlight.rects; track $index) {
                  <span
                    class="pdf-viewer__highlight"
                    [class.pdf-viewer__highlight--noted]="highlight.note"
                    [class.pdf-viewer__highlight--underline]="highlight.style === 'underline'"
                    [style.--highlight-color]="'var(--bs-' + highlight.color + ')'"
                    [style.left.%]="rect.x"
                    [style.top.%]="rect.y"
                    [style.width.%]="rect.width"
                    [style.height.%]="rect.height"></span>
                }
              }
            </div>
            <div #textLayer class="textLayer"></div>
            <app-pdf-ink
              [strokes]="inkStrokesOf(pageIndex + 1)"
              [mode]="inkMode()"
              [color]="inkColor()"
              (drawn)="inkDrawn.emit({ page: pageIndex + 1, points: $event, color: inkColor() })"
              (erased)="inkErased.emit($event)" />
            @if (menu()?.page === pageIndex + 1) {
              @let shown = menu()!;
              <app-annotation-menu
                class="pdf-viewer__menu"
                [class.pdf-viewer__menu--selection]="!shown.highlight"
                [class.pdf-viewer__menu--below]="shown.above < minTop"
                [style.left.%]="shown.left"
                [style.right.%]="shown.right"
                [style.--menu-above]="shown.above + '%'"
                [style.--menu-below]="shown.below + '%'"
                [color]="shown.highlight?.color ?? null"
                [markStyle]="shown.highlight?.style ?? null"
                [comment]="shown.highlight?.note ?? ''"
                (marked)="mark($event)"
                (commented)="comment()"
                (copied)="copy()"
                (deleted)="deleteHighlight()" />
            }
            @if (tooltip()?.page === pageIndex + 1) {
              @let shown = tooltip()!;
              <button
                type="button"
                class="pdf-viewer__tooltip d-flex flex-column text-start"
                [style.left.%]="shown.left"
                [style.right.%]="shown.right"
                [style.top.%]="shown.top"
                (click)="editTooltip($event)">
                <span class="pdf-viewer__tooltip-text">{{ shown.text }}</span>
                <span class="pdf-viewer__tooltip-hint">{{ editHint() }}</span>
              </button>
            }
          </div>
          <app-pdf-margin
            side="right"
            [notes]="marginNotesOf(pageIndex + 1, 'right')"
            [hint]="marginHint()"
            (added)="addMarginNote({ page: pageIndex + 1, side: 'right', y: $event })"
            (opened)="openMarginNote($event)"
            (grabbed)="grabMarginNote(pageIndex + 1, $event)" />
        </div>
      }
    </div>
  `,
  styles: `
    .pdf-viewer {
      display: flex;
      justify-content: safe center;
      container-type: inline-size;
    }

    .pdf-viewer__row {
      align-items: stretch;
    }

    .pdf-viewer__pages {
      flex-shrink: 0;
      gap: 1rem;
    }

    .pdf-viewer__page {
      position: relative;
      flex: 1 1 auto;
      min-width: 0;
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
        border-bottom: 3px solid var(--highlight-color);
      }

      .pdf-viewer__highlight--underline {
        background-color: transparent;
        mix-blend-mode: normal;
        border-bottom: 3px solid var(--highlight-color);
        border-radius: 0;
      }

      .pdf-viewer__menu {
        position: absolute;
        z-index: 2;
        top: var(--menu-above);
        transform: translateY(calc(-100% - 0.5rem));
      }

      .pdf-viewer__menu--below {
        top: var(--menu-below);
        transform: translateY(0.5rem);
      }

      @media (pointer: coarse) {
        .pdf-viewer__menu--selection {
          top: var(--menu-below);
          transform: translateY(0.5rem);
        }
      }

      .pdf-viewer__tooltip {
        position: absolute;
        z-index: 1;
        max-width: min(18rem, 90%);
        margin-top: 0.375rem;
        padding: 0.5rem 0.75rem;
        color: var(--bs-white);
        background-color: var(--bs-dark);
        border: 0;
        border-radius: 0.5rem;
        box-shadow: 0.25rem 0.25rem 0 rgba(var(--bs-dark-rgb), 0.18);
        cursor: pointer;
      }

      .pdf-viewer__tooltip-text {
        font-size: 0.875rem;
        white-space: pre-line;
      }

      .pdf-viewer__tooltip-hint {
        margin-top: 0.25rem;
        font-size: 0.75rem;
        opacity: 0.75;
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
  readonly highlighted = output<HighlightMark & { isCommenting?: boolean }>();
  readonly highlightChanged = output<HighlightUpdate>();
  readonly highlightDeleted = output<number>();
  readonly marginNotes = input<MarginNote[]>([]);
  readonly marginHint = input('');
  readonly marginAdded = output<MarginNoteDraft>();
  readonly marginNoteOpened = output<number>();
  readonly marginNoteMoved = output<MarginNoteMove>();
  readonly editHint = input('');
  readonly inkStrokes = input<InkStroke[]>([]);
  readonly inkMode = input<InkMode>('off');
  readonly inkColor = input<HighlightColor>('blue');
  readonly inkDrawn = output<InkStrokeDraft>();
  readonly inkErased = output<number>();

  protected readonly layout = signal<PdfLayout | null>(null);
  readonly #draggedNote = signal<MarginNoteMove | null>(null);
  readonly #peek = signal<AnnotationPeek | null>(null);
  readonly #selection = signal<PdfHighlightDraft | null>(null);
  protected readonly minTop = MENU_MIN_TOP;
  protected readonly tooltip = computed((): PdfTooltip | null => {
    const peek = this.#peek();
    const note =
      peek?.kind === 'margin' ? this.marginNotes().find(({ id }) => id === peek.id) : undefined;
    return note
      ? {
          page: note.page,
          text: note.text,
          top: note.y,
          left: note.side === 'left' ? 0 : null,
          right: note.side === 'right' ? 0 : null,
        }
      : null;
  });
  readonly #tappedHighlight = computed(() => {
    const peek = this.#peek();
    return peek?.kind === 'highlight'
      ? (this.highlights().find(({ id }) => id === peek.id) ?? null)
      : null;
  });
  protected readonly menu = computed((): PdfMenu | null => {
    const selection = this.#selection();
    const highlight = this.#tappedHighlight();
    const target = selection ?? highlight;
    const first = target?.rects[0];
    const last = target?.rects.at(-1);
    if (!target || !first || !last) return null;
    const isOnRightHalf = first.x > 50;
    return {
      page: target.page,
      above: first.y,
      below: last.y + last.height,
      left: isOnRightHalf ? null : first.x,
      right: isOnRightHalf ? 100 - last.x - last.width : null,
      highlight: selection ? null : highlight,
    };
  });
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
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
  readonly #inkByPage = computed(() =>
    this.inkStrokes().reduce(
      (pages, stroke) => pages.set(stroke.page, [...(pages.get(stroke.page) ?? []), stroke]),
      new Map<number, InkStroke[]>(),
    ),
  );
  readonly #marginNotesByKey = computed(() => {
    const dragged = this.#draggedNote();
    return this.marginNotes()
      .map((note) => (note.id === dragged?.id ? { ...note, ...dragged } : note))
      .reduce((groups, note) => {
        const key = `${note.page}-${note.side}`;
        return groups.set(key, [...(groups.get(key) ?? []), note]);
      }, new Map<string, MarginNote[]>());
  });
  #grab: (MarginNoteGrab & { page: number }) | null = null;
  #hasDragged = false;
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

  protected inkStrokesOf(page: number): InkStroke[] {
    return this.#inkByPage().get(page) ?? NO_STROKES;
  }

  protected marginNotesOf(page: number, side: MarginSide): MarginNote[] {
    return this.#marginNotesByKey().get(`${page}-${side}`) ?? [];
  }

  protected addMarginNote(draft: MarginNoteDraft): void {
    this.#peek.set(null);
    if (!this.#hasDragged) this.marginAdded.emit(draft);
  }

  protected openMarginNote(id: number): void {
    if (this.#hasDragged) return;
    const hasText = this.marginNotes().some((note) => note.id === id && note.text);
    if (hasText) this.#peek.set({ kind: 'margin', id });
    else this.marginNoteOpened.emit(id);
  }

  protected editTooltip(event: MouseEvent): void {
    event.stopPropagation();
    const peek = this.#peek();
    this.#peek.set(null);
    if (peek) this.marginNoteOpened.emit(peek.id);
  }

  protected mark(mark: HighlightMark): void {
    const highlight = this.#tappedHighlight();
    if (highlight) this.highlightChanged.emit({ id: highlight.id, ...mark });
    else this.#highlightSelection(mark);
  }

  protected comment(): void {
    const highlight = this.#tappedHighlight();
    if (!highlight)
      return this.#highlightSelection({ color: 'yellow', style: 'highlight', isCommenting: true });
    this.#peek.set(null);
    this.highlightOpened.emit(highlight.id);
  }

  protected copy(): void {
    const text = (this.#selection() ?? this.#tappedHighlight())?.text;
    if (text) void navigator.clipboard?.writeText(text);
    this.#closeMenu();
  }

  protected deleteHighlight(): void {
    const highlight = this.#tappedHighlight();
    if (highlight) this.highlightDeleted.emit(highlight.id);
    this.#closeMenu();
  }

  #highlightSelection(mark: HighlightMark & { isCommenting?: boolean }): void {
    this.highlighted.emit(mark);
    this.#closeMenu();
  }

  #closeMenu(): void {
    this.#peek.set(null);
    this.#selection.set(null);
    getSelection()?.removeAllRanges();
  }

  protected closeTooltipOutside({ target }: MouseEvent): void {
    if (!this.#element.nativeElement.contains(target as Node)) this.#peek.set(null);
  }

  protected forgetDrag(): void {
    this.#hasDragged = false;
  }

  protected grabMarginNote(page: number, grab: MarginNoteGrab): void {
    this.#peek.set(null);
    this.#grab = { ...grab, page };
  }

  protected dragMarginNote({ clientX, clientY }: PointerEvent): void {
    const grab = this.#grab;
    if (!grab) return;
    if (!this.#hasDragged && Math.hypot(clientX - grab.x, clientY - grab.y) < DRAG_THRESHOLD_PX)
      return;
    this.#hasDragged = true;
    const page = this.pages()[grab.page - 1].nativeElement.getBoundingClientRect();
    this.#draggedNote.set({
      id: grab.id,
      y:
        Math.round(Math.min(Math.max(toPercent(clientY - page.top, page.height), 0), 100) * 10) /
        10,
      side: clientX < page.left + page.width / 2 ? 'left' : 'right',
    });
  }

  protected dropMarginNote(): void {
    const dragged = this.#draggedNote();
    if (dragged) this.marginNoteMoved.emit(dragged);
    this.cancelMarginDrag();
  }

  protected cancelMarginDrag(): void {
    this.#grab = null;
    this.#draggedNote.set(null);
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
      this.#selection.set(null);
      this.selected.emit(null);
      return;
    }
    const page = this.pages()[pageIndex].nativeElement.getBoundingClientRect();
    const draft: PdfHighlightDraft = {
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
    };
    this.#peek.set(null);
    this.#selection.set(draft.rects.length ? draft : null);
    this.selected.emit(draft);
  }

  protected openHighlightAt({ target, clientX, clientY }: MouseEvent): void {
    if (this.inkMode() !== 'off' || !getSelection()?.isCollapsed) return;
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
    this.#peek.set(highlight ? { kind: 'highlight', id: highlight.id } : null);
  }

  #disconnect(): void {
    this.#observers.forEach((observer) => observer.disconnect());
    this.#observers = [];
  }
}
