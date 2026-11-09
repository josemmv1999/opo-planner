import { journeyPercentage } from './journey-percentage';

describe('journeyPercentage', () => {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 0, 11);

  it('returns the elapsed share of the days between start and end', () => {
    expect(journeyPercentage(start, end, new Date(2026, 0, 5))).toBe(40);
  });

  it('ignores the time of day', () => {
    expect(journeyPercentage(start, end, new Date(2026, 0, 5, 23, 59))).toBe(40);
  });

  it('is 0 before the start and 100 after the end', () => {
    expect(journeyPercentage(start, end, new Date(2025, 11, 20))).toBe(0);
    expect(journeyPercentage(start, end, new Date(2026, 1, 1))).toBe(100);
  });

  it('is 100 when the end is not after the start', () => {
    expect(journeyPercentage(end, start, new Date(2026, 0, 5))).toBe(100);
  });
});
