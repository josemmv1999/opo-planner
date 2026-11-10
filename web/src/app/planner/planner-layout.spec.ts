import { describe, expect, it } from 'vitest';
import { CalendarEntry, OtherPlannerEntry } from '../../common/models/planner.model';
import { findClash, placeEntries } from './planner-layout';

const OTHER: OtherPlannerEntry = {
  id: 1,
  text: 'Tema 4',
  start: '2026-11-11T18:30:00',
  end: '2026-11-11T20:00:00',
  oppositionName: 'Seguridad Social',
};

describe('findClash', () => {
  it('finds a task of another opposition that overlaps the draft', () => {
    const draft = { text: '', date: '2026-11-11', start: '19:00', end: '20:30' };
    expect(findClash(draft, [OTHER])).toBe(OTHER);
  });

  it('ignores tasks that only touch the draft or are on another day', () => {
    expect(
      findClash({ text: '', date: '2026-11-11', start: '17:30', end: '18:30' }, [OTHER]),
    ).toBeNull();
    expect(
      findClash({ text: '', date: '2026-11-12', start: '19:00', end: '20:00' }, [OTHER]),
    ).toBeNull();
  });
});

const entry = (id: number, start: string, end: string): CalendarEntry => ({
  id,
  text: `Entry ${id}`,
  start: `2026-11-10T${start}:00`,
  end: `2026-11-10T${end}:00`,
  isDone: false,
  isRecord: false,
  oppositionName: null,
});

describe('placeEntries', () => {
  it('cascades later entries and puts the ones that start together side by side', () => {
    const placed = placeEntries([
      entry(1, '17:30', '19:00'),
      entry(2, '18:30', '18:30'),
      entry(3, '18:30', '18:35'),
      entry(4, '19:00', '20:00'),
    ]);
    expect(placed.map(({ id, lane, slot, slots }) => ({ id, lane, slot, slots }))).toEqual([
      { id: 1, lane: 0, slot: 0, slots: 1 },
      { id: 3, lane: 1, slot: 0, slots: 2 },
      { id: 2, lane: 1, slot: 1, slots: 2 },
      { id: 4, lane: 0, slot: 0, slots: 1 },
    ]);
  });

  it('gives very short entries at least half an hour of height', () => {
    const [record] = placeEntries([entry(1, '18:30', '18:30')]);
    expect(record.endRow - record.startRow).toBe(2);
    expect(record.isShort).toBe(true);
  });
});
