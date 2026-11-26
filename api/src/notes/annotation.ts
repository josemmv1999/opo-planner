export const ANNOTATION_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];
const TEXT_KINDS = ['highlight', 'underline'];

export interface AnnotationRow {
  id: number;
  kind: 'highlight' | 'underline' | 'margin' | 'ink';
  page: number;
  text: string | null;
  rects: string | null;
  y: number | null;
  side: 'left' | 'right' | null;
  width: number | null;
  color: string;
  comment: string;
}

export type NewAnnotation = Omit<AnnotationRow, 'id'>;
export type AnnotationChange = Pick<AnnotationRow, 'kind' | 'color' | 'comment' | 'y' | 'side'>;

const placeOf = (row: AnnotationRow) => {
  if (row.kind === 'margin') return { y: row.y, side: row.side };
  const shapes = JSON.parse(row.rects ?? '[]') as unknown[];
  return row.kind === 'ink'
    ? { points: shapes, width: row.width ?? DEFAULT_INK_WIDTH }
    : { text: row.text, rects: shapes };
};

export const toAnnotation = (row: AnnotationRow) => ({
  id: row.id,
  kind: row.kind,
  page: row.page,
  color: row.color,
  comment: row.comment,
  ...placeOf(row),
});

const isRect = (rect: unknown): boolean =>
  ['x', 'y', 'width', 'height'].every(
    (key) => typeof (rect as Record<string, unknown>)?.[key] === 'number',
  );

const isPercent = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 100;

const isPoint = (point: unknown): boolean =>
  ['x', 'y'].every((key) => isPercent((point as Record<string, unknown>)?.[key]));

const MAX_INK_POINTS = 2000;
const DEFAULT_INK_WIDTH = 0.4;
const MAX_INK_WIDTH = 5;

const isInkWidth = (value: unknown): value is number =>
  typeof value === 'number' && value > 0 && value <= MAX_INK_WIDTH;

export const parseNewAnnotation = (body: unknown): NewAnnotation | null => {
  const {
    kind,
    page,
    text,
    rects,
    points,
    width = DEFAULT_INK_WIDTH,
    y,
    side,
    color,
    comment = '',
  } = (body ?? {}) as Record<string, unknown>;
  const isHighlight =
    TEXT_KINDS.includes(kind as string) &&
    typeof text === 'string' &&
    Array.isArray(rects) &&
    rects.length > 0 &&
    rects.every(isRect);
  const isMargin = kind === 'margin' && isPercent(y) && (side === 'left' || side === 'right');
  const isInk =
    kind === 'ink' &&
    Array.isArray(points) &&
    points.length > 0 &&
    points.length <= MAX_INK_POINTS &&
    points.every(isPoint) &&
    isInkWidth(width);
  const isValid =
    (isHighlight || isMargin || isInk) &&
    Number.isInteger(page) &&
    (page as number) > 0 &&
    ANNOTATION_COLORS.includes(color as string) &&
    typeof comment === 'string';
  return isValid
    ? {
        kind: kind as AnnotationRow['kind'],
        page: page as number,
        text: isHighlight ? text : null,
        rects: isHighlight ? JSON.stringify(rects) : isInk ? JSON.stringify(points) : null,
        y: isMargin ? y : null,
        side: isMargin ? side : null,
        width: isInk ? (width as number) : null,
        color: color as string,
        comment: comment as string,
      }
    : null;
};

export const parseAnnotationChange = (
  body: unknown,
  current: AnnotationRow,
): AnnotationChange | null => {
  const {
    kind = current.kind,
    color = current.color,
    comment = current.comment,
    y = current.y,
    side = current.side,
  } = (body ?? {}) as Record<string, unknown>;
  const isPlaceValid =
    current.kind === 'margin'
      ? kind === 'margin' && isPercent(y) && (side === 'left' || side === 'right')
      : (current.kind === 'ink' ? kind === 'ink' : TEXT_KINDS.includes(kind as string)) &&
        y === null &&
        side === null;
  return ANNOTATION_COLORS.includes(color as string) && typeof comment === 'string' && isPlaceValid
    ? {
        kind: kind as AnnotationRow['kind'],
        color: color as string,
        comment,
        y: y as number | null,
        side: side as AnnotationRow['side'],
      }
    : null;
};
