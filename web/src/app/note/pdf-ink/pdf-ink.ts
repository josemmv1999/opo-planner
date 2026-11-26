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
  InkMode,
  InkPoint,
  InkStroke,
} from '../../../common/models/syllabus.model';

const MIN_STEP_PERCENT = 0.25;

const toSvgPoints = (points: InkPoint[]): string =>
  (points.length === 1 ? [points[0], points[0]] : points).map(({ x, y }) => `${x},${y}`).join(' ');

const toColor = (color: HighlightColor): string => `var(--bs-${color})`;

const roundPercent = (value: number, size: number): number =>
  Math.round(Math.min(Math.max((value / size) * 100, 0), 100) * 100) / 100;

const isStylus = (touch: Touch): boolean =>
  (touch as Touch & { touchType?: string }).touchType === 'stylus';

@Component({
  selector: 'app-pdf-ink',
  host: {
    class: 'pdf-ink',
    '[class.pdf-ink--active]': "mode() !== 'off'",
    '[class.pdf-ink--erase]': "mode() === 'erase'",
    '(pointerdown)': 'start($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'end()',
    '(pointercancel)': 'cancel()',
    '(touchstart)': 'holdStylus($event)',
    '(touchmove)': 'holdStylus($event)',
  },
  template: `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      @for (stroke of paths(); track stroke.id) {
        <polyline
          class="pdf-ink__stroke"
          [attr.points]="stroke.points"
          [style.stroke]="stroke.color" />
        @if (mode() === 'erase') {
          <polyline
            class="pdf-ink__hit"
            [attr.points]="stroke.points"
            [attr.data-ink-id]="stroke.id" />
        }
      }
      @if (livePoints(); as points) {
        <polyline class="pdf-ink__stroke" [attr.points]="points" [style.stroke]="liveColor()" />
      }
    </svg>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
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
      pointer-events: none;
    }

    .pdf-ink__stroke {
      stroke-width: calc(0.1875rem * var(--pdf-zoom, 1));
    }

    .pdf-ink__hit {
      stroke: transparent;
      pointer-events: stroke;
      stroke-width: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfInk {
  readonly strokes = input.required<InkStroke[]>();
  readonly mode = input.required<InkMode>();
  readonly color = input.required<HighlightColor>();
  readonly drawn = output<InkPoint[]>();
  readonly erased = output<number>();

  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #live = signal<InkPoint[] | null>(null);
  #box: DOMRect | null = null;
  #isErasing = false;

  protected readonly paths = computed(() =>
    this.strokes().map(({ id, color, points }) => ({
      id,
      color: toColor(color),
      points: toSvgPoints(points),
    })),
  );
  protected readonly livePoints = computed(() => {
    const live = this.#live();
    return live ? toSvgPoints(live) : null;
  });
  protected readonly liveColor = computed(() => toColor(this.color()));

  protected start(event: PointerEvent): void {
    if (this.mode() === 'off' || event.pointerType === 'touch' || event.button !== 0) return;
    event.preventDefault();
    this.#element.nativeElement.setPointerCapture(event.pointerId);
    this.#box = this.#element.nativeElement.getBoundingClientRect();
    if (this.mode() === 'draw') this.#live.set([this.#pointOf(event, this.#box)]);
    else {
      this.#isErasing = true;
      this.#eraseAt(event);
    }
  }

  protected move(event: PointerEvent): void {
    const box = this.#box;
    if (!box || event.pointerType === 'touch') return;
    if (this.#isErasing) return this.#eraseAt(event);
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
    this.cancel();
  }

  protected cancel(): void {
    this.#live.set(null);
    this.#box = null;
    this.#isErasing = false;
  }

  protected holdStylus(event: TouchEvent): void {
    if (this.mode() !== 'off' && [...event.changedTouches].some(isStylus)) event.preventDefault();
  }

  #pointOf({ clientX, clientY }: PointerEvent, box: DOMRect): InkPoint {
    return {
      x: roundPercent(clientX - box.left, box.width),
      y: roundPercent(clientY - box.top, box.height),
    };
  }

  #eraseAt({ clientX, clientY }: PointerEvent): void {
    const id = document
      .elementFromPoint(clientX, clientY)
      ?.closest('[data-ink-id]')
      ?.getAttribute('data-ink-id');
    if (id) this.erased.emit(Number(id));
  }
}
