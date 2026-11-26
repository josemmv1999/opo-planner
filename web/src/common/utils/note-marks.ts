import { HIGHLIGHT_COLORS, HighlightColor, HighlightStyle } from '../models/syllabus.model';

export const NOTE_MARK_SELECTOR = 'mark, u';

export interface NoteMark {
  color: HighlightColor;
  style: HighlightStyle;
  comment: string;
}

export const readNoteMark = (element: Element): NoteMark => ({
  color:
    HIGHLIGHT_COLORS.find((color) => element.classList.contains(`note-mark--${color}`)) ?? 'yellow',
  style: element.tagName === 'U' ? 'underline' : 'highlight',
  comment: element.getAttribute('title') ?? '',
});

export const changeNoteMark = (
  html: string,
  index: number,
  change: Partial<NoteMark> | null,
): string => {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const element = body.querySelectorAll(NOTE_MARK_SELECTOR)[index];
  if (!element) return html;
  if (!change) {
    element.replaceWith(...element.childNodes);
    return body.innerHTML;
  }
  const { color, style, comment } = { ...readNoteMark(element), ...change };
  const next = body.ownerDocument.createElement(style === 'underline' ? 'u' : 'mark');
  next.className = `note-mark note-mark--${color}`;
  if (comment) next.title = comment;
  next.append(...element.childNodes);
  element.replaceWith(next);
  return body.innerHTML;
};
