import { describe, expect, it } from 'vitest';
import { densify, erasePiece, tipsBetween } from './ink-geometry';

const LINE = [
  { x: 0, y: 10 },
  { x: 20, y: 10 },
];

describe('ink geometry', () => {
  it('adds points so no gap is longer than the step', () => {
    expect(densify(LINE, 5, 1).map(({ x }) => x)).toEqual([0, 5, 10, 15, 20]);
  });

  it('cuts the part of a stroke under the eraser and keeps both sides', () => {
    const pieces = erasePiece(LINE, { center: { x: 10, y: 10 }, radius: 2, ratio: 1 });
    expect(pieces).toHaveLength(2);
    expect(pieces[0].at(-1)!.x).toBeLessThan(8);
    expect(pieces[1][0].x).toBeGreaterThan(12);
  });

  it('leaves untouched strokes as they are and removes fully erased ones', () => {
    expect(erasePiece(LINE, { center: { x: 10, y: 30 }, radius: 2, ratio: 1 })).toEqual([LINE]);
    expect(erasePiece([{ x: 5, y: 5 }], { center: { x: 5, y: 5 }, radius: 1, ratio: 1 })).toEqual(
      [],
    );
  });

  it('measures the vertical distance with the page ratio', () => {
    const tip = { center: { x: 10, y: 12 }, radius: 3, ratio: 2 };
    expect(erasePiece(LINE, tip)).toEqual([LINE]);
  });

  it('places eraser tips along a fast move', () => {
    const tips = tipsBetween(
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { center: { x: 0, y: 0 }, radius: 2, ratio: 1 },
    );
    expect(tips.map(({ center }) => center.x)).toEqual([1, 2, 3, 4]);
  });
});
