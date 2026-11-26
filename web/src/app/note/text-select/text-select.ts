import { Directive, input, output } from '@angular/core';

const LONG_PRESS_MS = 350;
const MOVE_TOLERANCE_PX = 10;
const MENU_SELECTOR = 'app-annotation-menu';

interface Caret {
  node: Text;
  offset: number;
}

const textNodeAt = (x: number, y: number): Text | null => {
  const span = document.elementFromPoint(x, y)?.closest('.textLayer span');
  return (
    [...(span?.childNodes ?? [])].find(
      (child): child is Text => child.nodeType === Node.TEXT_NODE,
    ) ?? null
  );
};

const caretAt = (x: number, y: number): Caret | null => {
  const node = textNodeAt(x, y);
  if (!node) return null;
  const range = document.createRange();
  const offset = Array.from({ length: node.length }, (_, index) => index).find((index) => {
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    const { left, width } = range.getBoundingClientRect();
    return x < left + width / 2;
  });
  return { node, offset: offset ?? node.length };
};

const rangeBetween = (anchor: Caret, focus: Caret): Range => {
  const range = document.createRange();
  range.setStart(anchor.node, anchor.offset);
  const [start, end] =
    range.comparePoint(focus.node, focus.offset) < 0 ? [focus, anchor] : [anchor, focus];
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
};

const wordAround = ({ node, offset }: Caret): Range => {
  const before = node.data.slice(0, offset).match(/\S*$/)?.[0].length ?? 0;
  const after = node.data.slice(offset).match(/^\S*/)?.[0].length ?? 0;
  return rangeBetween({ node, offset: offset - before }, { node, offset: offset + after });
};

@Directive({
  selector: '[appTextSelect]',
  host: {
    '(pointerdown)': 'press($event)',
    '(pointermove)': 'drag($event)',
    '(pointerup)': 'release()',
    '(pointercancel)': 'reset()',
    '(touchmove)': 'holdScroll($event)',
  },
})
export class TextSelect {
  readonly isTextSelectEnabled = input(true);
  readonly rangeSelected = output<Range | null>();

  #start: { x: number; y: number } | null = null;
  #anchor: Caret | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #isSelecting = false;
  #hasMoved = false;
  #hasSelected = false;

  protected press(event: PointerEvent): void {
    const isOnMenu = (event.target as Element).closest(MENU_SELECTOR);
    if (!this.isTextSelectEnabled() || event.pointerType === 'mouse' || isOnMenu) return;
    this.reset();
    const { clientX: x, clientY: y } = event;
    this.#start = { x, y };
    if (event.pointerType === 'pen') this.#isSelecting = true;
    else this.#timer = setTimeout(() => this.#selectWordAt(x, y), LONG_PRESS_MS);
  }

  protected drag({ clientX: x, clientY: y }: PointerEvent): void {
    const start = this.#start;
    if (!start) return;
    if (!this.#isSelecting) {
      if (Math.hypot(x - start.x, y - start.y) > MOVE_TOLERANCE_PX) {
        this.#hasMoved = true;
        clearTimeout(this.#timer);
      }
      return;
    }
    const focus = caretAt(x, y);
    this.#anchor ??= focus;
    if (!this.#anchor || !focus) return;
    this.#hasSelected = true;
    this.rangeSelected.emit(rangeBetween(this.#anchor, focus));
  }

  protected release(): void {
    if (this.#start && !this.#hasSelected && !this.#hasMoved) this.rangeSelected.emit(null);
    this.reset();
  }

  protected reset(): void {
    clearTimeout(this.#timer);
    this.#start = null;
    this.#anchor = null;
    this.#isSelecting = false;
    this.#hasMoved = false;
    this.#hasSelected = false;
  }

  protected holdScroll(event: TouchEvent): void {
    if (this.#isSelecting) event.preventDefault();
  }

  #selectWordAt(x: number, y: number): void {
    const caret = caretAt(x, y);
    if (!caret) return;
    const word = wordAround(caret);
    this.#anchor = { node: caret.node, offset: word.startOffset };
    this.#isSelecting = true;
    this.#hasSelected = true;
    this.rangeSelected.emit(word);
  }
}
