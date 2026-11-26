export const ANNOTATION_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];

export interface AnnotationRow {
  id: number;
  kind: 'highlight' | 'margin';
  page: number;
  text: string | null;
  rects: string | null;
  y: number | null;
  side: 'left' | 'right' | null;
  color: string;
  comment: string;
}

export type NewAnnotation = Omit<AnnotationRow, 'id'>;
export type AnnotationChange = Pick<AnnotationRow, 'color' | 'comment' | 'y' | 'side'>;

export const toAnnotation = (row: AnnotationRow) => ({
  id: row.id,
  kind: row.kind,
  page: row.page,
  color: row.color,
  comment: row.comment,
  ...(row.kind === 'highlight'
    ? { text: row.text, rects: JSON.parse(row.rects ?? '[]') as unknown[] }
    : { y: row.y, side: row.side }),
});

const isRect = (rect: unknown): boolean =>
  ['x', 'y', 'width', 'height'].every(
    (key) => typeof (rect as Record<string, unknown>)?.[key] === 'number',
  );

const isPercent = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 100;

export const parseNewAnnotation = (body: unknown): NewAnnotation | null => {
  const {
    kind,
    page,
    text,
    rects,
    y,
    side,
    color,
    comment = '',
  } = (body ?? {}) as Record<string, unknown>;
  const isHighlight =
    kind === 'highlight' &&
    typeof text === 'string' &&
    Array.isArray(rects) &&
    rects.length > 0 &&
    rects.every(isRect);
  const isMargin = kind === 'margin' && isPercent(y) && (side === 'left' || side === 'right');
  const isValid =
    (isHighlight || isMargin) &&
    Number.isInteger(page) &&
    (page as number) > 0 &&
    ANNOTATION_COLORS.includes(color as string) &&
    typeof comment === 'string';
  return isValid
    ? {
        kind,
        page: page as number,
        text: isHighlight ? text : null,
        rects: isHighlight ? JSON.stringify(rects) : null,
        y: isMargin ? y : null,
        side: isMargin ? side : null,
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
    color = current.color,
    comment = current.comment,
    y = current.y,
    side = current.side,
  } = (body ?? {}) as Record<string, unknown>;
  const isPlaceValid =
    current.kind === 'margin'
      ? isPercent(y) && (side === 'left' || side === 'right')
      : y === null && side === null;
  return ANNOTATION_COLORS.includes(color as string) && typeof comment === 'string' && isPlaceValid
    ? {
        color: color as string,
        comment,
        y: y as number | null,
        side: side as AnnotationRow['side'],
      }
    : null;
};
