import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  HighlightColor,
  InkErase,
  InkMode,
  InkPoint,
  InkStroke,
} from '../../../common/models/syllabus.model';
import { EraserTip, erasePiece, tipsBetween } from './ink-geometry';

const MIN_STEP_PERCENT = 0.25;

const toSvgPoints = (points: InkPoint[]): string =>
  (points.length === 1 ? [points[0], points[0]] : points).map(({ x, y }) => `${x},${y}`).join(' ');

const toColor = (color: HighlightColor): string => `var(--bs-${color})`;

const toStrokeWidth = (width: number): string => `calc(${width} * 1cqi)`;

const roundPercent = (value: number, size: number): number =>
  Math.round(Math.min(Math.max((value / size) * 100, 0), 100) * 100) / 100;

const isStylus = (touch: Touch): boolean =>
  (touch as Touch & { touchType?: string }).touchType === 'stylus';

@Component({
  selector: 'app-pdf-ink',
  host: {
    class: 'pdf-ink',
    '[class.pdf-ink--active]': "mode() !== 'off'",
    '(pointerdown)': 'start($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'end()',
    '(pointercancel)': 'cancel()',
    '(pointerleave)': 'eraser.set(null)',
    '(touchstart)': 'holdStylus($event)',
    '(touchmove)': 'holdStylus($event)',
  },
  template: `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      @for (path of paths(); track path.key) {
        <polyline
          [attr.points]="path.points"
          [style.stroke]="path.color"
          [style.stroke-width]="path.width" />
      }
      @if (livePoints(); as points) {
        <polyline
          [attr.points]="points"
          [style.stroke]="liveColor()"
          [style.stroke-width]="liveWidth()" />
      }
    </svg>
    @if (mode() === 'erase' && eraser(); as tip) {
      <span
        class="pdf-ink__eraser"
        [style.left.%]="tip.x"
        [style.top.%]="tip.y"
        [style.width]="eraserSize()"></span>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      container-type: size;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }

    :host(.pdf-ink--active) {
      pointer-events: auto;
      cursor: crosshair;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    polyline {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .pdf-ink__eraser {
      position: absolute;
      aspect-ratio: 1;
      border: 1px solid var(--bs-dark);
      border-radius: 50%;
      background-color: rgba(var(--bs-white-rgb), 0.4);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfInk {
  readonly strokes = input.required<InkStroke[]>();
  readonly mode = input.required<InkMode>();
  readonly color = input.required<HighlightColor>();
  readonly width = input.required<number>();
  readonly eraserWidth = input.required<number>();
  readonly drawn = output<InkPoint[]>();
  readonly erased = output<InkErase[]>();

  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #live = signal<InkPoint[] | null>(null);
  readonly #cuts = signal(new Map<number, InkPoint[][]>());
  protected readonly eraser = signal<InkPoint | null>(null);
  #box: DOMRect | null = null;
  #isErasing = false;

  protected readonly paths = computed(() => {
    const cuts = this.#cuts();
    return this.strokes().flatMap(({ id, color, width, points }) =>
      (cuts.get(id) ?? [points]).map((piece, index) => ({
        key: `${id}-${index}`,
        color: toColor(color),
        width: toStrokeWidth(width),
        points: toSvgPoints(piece),
      })),
    );
  });
  protected readonly livePoints = computed(() => {
    const live = this.#live();
    return live ? toSvgPoints(live) : null;
  });
  protected readonly liveColor = computed(() => toColor(this.color()));
  protected readonly liveWidth = computed(() => toStrokeWidth(this.width()));
  protected readonly eraserSize = computed(() => `${this.eraserWidth()}cqi`);

  protected start(event: PointerEvent): void {
    if (this.mode() === 'off' || event.pointerType === 'touch' || event.button !== 0) return;
    event.preventDefault();
    this.#element.nativeElement.setPointerCapture(event.pointerId);
    this.#box = this.#element.nativeElement.getBoundingClientRect();
    const point = this.#pointOf(event, this.#box);
    if (this.mode() === 'draw') return this.#live.set([point]);
    this.#isErasing = true;
    this.eraser.set(point);
    this.#erase([this.#tipAt(point, this.#box)]);
  }

  protected move(event: PointerEvent): void {
    if (event.pointerType === 'touch' || this.mode() === 'off') return;
    const box = this.#box ?? this.#element.nativeElement.getBoundingClientRect();
    if (this.mode() === 'erase') return this.#moveEraser(event, box);
    const live = this.#live();
    if (!live) return;
    const added = (event.getCoalescedEvents?.() ?? [event])
      .map((sample) => this.#pointOf(sample, box))
      .reduce<InkPoint[]>((points, point) => {
        const last = points.at(-1) ?? live.at(-1);
        return last && Math.hypot(point.x - last.x, point.y - last.y) < MIN_STEP_PERCENT
          ? points
          : [...points, point];
      }, []);
    if (added.length) this.#live.set([...live, ...added]);
  }

  protected end(): void {
    const live = this.#live();
    if (live) this.drawn.emit(live);
    const erases = [...this.#cuts()].map(([id, pieces]) => ({ id, pieces }));
    if (erases.length) this.erased.emit(erases);
    this.cancel();
  }

  protected cancel(): void {
    this.#live.set(null);
    this.#cuts.set(new Map());
    this.#box = null;
    this.#isErasing = false;
  }

  protected holdStylus(event: TouchEvent): void {
    if (this.mode() !== 'off' && [...event.changedTouches].some(isStylus)) event.preventDefault();
  }

  #moveEraser(event: PointerEvent, box: DOMRect): void {
    const point = this.#pointOf(event, box);
    const previous = this.eraser();
    this.eraser.set(point);
    if (this.#isErasing && previous)
      this.#erase(tipsBetween(previous, point, this.#tipAt(point, box)));
  }

  #tipAt(center: InkPoint, box: DOMRect): EraserTip {
    return { center, radius: this.eraserWidth() / 2, ratio: box.height / box.width };
  }

  #erase(tips: EraserTip[]): void {
    const cuts = new Map(this.#cuts());
    this.strokes().forEach(({ id, points }) => {
      const before = cuts.get(id) ?? [points];
      const after = tips.reduce(
        (pieces, tip) => pieces.flatMap((piece) => erasePiece(piece, tip)),
        before,
      );
      if (after.length !== before.length || after.some((piece, index) => piece !== before[index]))
        cuts.set(id, after);
    });
    this.#cuts.set(cuts);
  }

  #pointOf({ clientX, clientY }: PointerEvent, box: DOMRect): InkPoint {
    return {
      x: roundPercent(clientX - box.left, box.width),
      y: roundPercent(clientY - box.top, box.height),
    };
  }
}
