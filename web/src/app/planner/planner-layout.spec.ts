import { describe, expect, it } from 'vitest';
import { OtherPlannerEntry } from '../../common/models/planner.model';
import { findClash } from './planner-layout';

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
