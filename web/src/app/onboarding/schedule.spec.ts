import { describe, expect, it } from 'vitest';
import { findClash, isScheduleComplete, slotIssue, weeklyMinutes } from './schedule';

const slot = (start: string, end: string) => ({ start, end });

describe('slotIssue', () => {
  it('flags a slot that ends before it starts', () => {
    expect(slotIssue([slot('11:00', '09:00')], 0)).toEqual({ kind: 'reversed' });
    expect(slotIssue([slot('09:00', '09:00')], 0)).toEqual({ kind: 'reversed' });
  });

  it('flags both slots when they overlap', () => {
    const slots = [slot('09:00', '11:00'), slot('10:00', '12:00')];
    expect(slotIssue(slots, 0)).toEqual({ kind: 'overlap', slot: slots[1] });
    expect(slotIssue(slots, 1)).toEqual({ kind: 'overlap', slot: slots[0] });
  });

  it('allows slots that only touch', () => {
    expect(slotIssue([slot('09:00', '11:00'), slot('11:00', '12:00')], 0)).toBeNull();
  });
});

describe('isScheduleComplete', () => {
  it('needs at least one day and one valid slot', () => {
    expect(isScheduleComplete({ days: [0], slots: [slot('09:00', '10:00')] })).toBe(true);
    expect(isScheduleComplete({ days: [], slots: [slot('09:00', '10:00')] })).toBe(false);
    expect(isScheduleComplete({ days: [0], slots: [] })).toBe(false);
    expect(isScheduleComplete({ days: [0], slots: [slot('10:00', '09:00')] })).toBe(false);
  });
});

describe('weeklyMinutes', () => {
  it('multiplies the daily minutes by the number of days', () => {
    expect(
      weeklyMinutes({
        days: [0, 1, 2, 3, 4],
        slots: [slot('09:00', '11:00'), slot('17:00', '18:30')],
      }),
    ).toBe(5 * 210);
  });

  it('counts overlapping time only once and ignores reversed slots', () => {
    expect(
      weeklyMinutes({ days: [0], slots: [slot('09:00', '11:00'), slot('10:00', '12:00')] }),
    ).toBe(180);
    expect(weeklyMinutes({ days: [0], slots: [slot('11:00', '09:00')] })).toBe(0);
  });
});

describe('findClash', () => {
  const other = {
    oppositionName: 'Seguridad Social',
    schedule: { days: [0, 1, 5], slots: [slot('18:00', '19:00')] },
  };

  it('returns the shared days and the overlapping time with another opposition', () => {
    expect(findClash(slot('17:00', '18:30'), [0, 1, 2], [other])).toEqual({
      oppositionName: 'Seguridad Social',
      days: [0, 1],
      start: '18:00',
      end: '18:30',
    });
  });

  it('ignores slots on days the other opposition does not study', () => {
    expect(findClash(slot('17:00', '18:30'), [2, 3], [other])).toBeNull();
  });

  it('ignores slots that do not overlap in time', () => {
    expect(findClash(slot('09:00', '11:00'), [0], [other])).toBeNull();
  });
});
