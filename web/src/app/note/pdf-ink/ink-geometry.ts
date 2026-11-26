import { InkPoint } from '../../../common/models/syllabus.model';

export interface EraserTip {
  center: InkPoint;
  radius: number;
  ratio: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

const distance = (a: InkPoint, b: InkPoint, ratio: number): number =>
  Math.hypot(a.x - b.x, (a.y - b.y) * ratio);

export const densify = (points: InkPoint[], step: number, ratio: number): InkPoint[] =>
  points.flatMap((point, index) => {
    const previous = points[index - 1];
    if (!previous) return [point];
    const parts = Math.ceil(distance(previous, point, ratio) / step);
    return Array.from({ length: parts }, (_, part) => {
      const t = (part + 1) / parts;
      return part === parts - 1
        ? point
        : {
            x: round(previous.x + (point.x - previous.x) * t),
            y: round(previous.y + (point.y - previous.y) * t),
          };
    });
  });

export const erasePiece = (
  points: InkPoint[],
  { center, radius, ratio }: EraserTip,
): InkPoint[][] => {
  const dense = densify(points, radius / 2, ratio);
  if (!dense.some((point) => distance(point, center, ratio) <= radius)) return [points];
  return dense
    .reduce<InkPoint[][]>(
      (pieces, point) =>
        distance(point, center, ratio) <= radius
          ? pieces.at(-1)?.length
            ? [...pieces, []]
            : pieces
          : [...pieces.slice(0, -1), [...(pieces.at(-1) ?? []), point]],
      [[]],
    )
    .filter((piece) => piece.length > 1);
};

export const tipsBetween = (from: InkPoint, to: InkPoint, tip: EraserTip): EraserTip[] =>
  densify([from, to], tip.radius / 2, tip.ratio)
    .slice(1)
    .map((center) => ({ ...tip, center }));
