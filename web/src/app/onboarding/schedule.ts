import { StudySchedule, TimeSlot } from '../../common/models/onboarding.model';

export type SlotIssue = { kind: 'reversed' } | { kind: 'overlap'; slot: TimeSlot };

export interface ScheduleClash {
  oppositionName: string;
  days: number[];
  start: string;
  end: string;
}

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

export const addMinutesToTime = (time: string, minutes: number): string => {
  const total = Math.min(toMinutes(time) + minutes, LAST_MINUTE_OF_DAY);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

const isReversed = ({ start, end }: TimeSlot): boolean =>
  Boolean(start && end) && toMinutes(end) <= toMinutes(start);

const slotsOverlap = (a: TimeSlot, b: TimeSlot): boolean =>
  !isReversed(a) &&
  !isReversed(b) &&
  toMinutes(a.start) < toMinutes(b.end) &&
  toMinutes(b.start) < toMinutes(a.end);

export const slotIssue = (slots: TimeSlot[], index: number): SlotIssue | null => {
  const slot = slots[index];
  if (isReversed(slot)) return { kind: 'reversed' };
  const other = slots.find((candidate, i) => i !== index && slotsOverlap(slot, candidate));
  return other ? { kind: 'overlap', slot: other } : null;
};

export const isScheduleComplete = ({ days, slots }: StudySchedule): boolean =>
  days.length > 0 && slots.length > 0 && slots.every((_, index) => !slotIssue(slots, index));

export const weeklyMinutes = ({ days, slots }: StudySchedule): number => {
  const ranges = slots
    .filter((slot) => !isReversed(slot))
    .map(({ start, end }) => [toMinutes(start), toMinutes(end)])
    .sort((a, b) => a[0] - b[0]);
  const merged = ranges.reduce<number[][]>((acc, [start, end]) => {
    const last = acc.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else acc.push([start, end]);
    return acc;
  }, []);
  return days.length * merged.reduce((sum, [start, end]) => sum + end - start, 0);
};

const latest = (a: string, b: string): string => (toMinutes(a) > toMinutes(b) ? a : b);
const earliest = (a: string, b: string): string => (toMinutes(a) < toMinutes(b) ? a : b);

export const findClash = (
  slot: TimeSlot,
  days: number[],
  others: { oppositionName: string; schedule: StudySchedule }[],
): ScheduleClash | null => {
  const ownDays = new Set(days);
  for (const { oppositionName, schedule } of others) {
    const sharedDays = schedule.days.filter((day) => ownDays.has(day));
    const clash = sharedDays.length
      ? schedule.slots.find((other) => slotsOverlap(slot, other))
      : undefined;
    if (clash) {
      return {
        oppositionName,
        days: sharedDays,
        start: latest(slot.start, clash.start),
        end: earliest(slot.end, clash.end),
      };
    }
  }
  return null;
};

const NEW_SLOT_MINUTES = 120;

export const toggleScheduleDay = (schedule: StudySchedule, day: number): StudySchedule => ({
  ...schedule,
  days: schedule.days.includes(day)
    ? schedule.days.filter((selected) => selected !== day)
    : [...schedule.days, day].sort((a, b) => a - b),
});

export const addScheduleSlot = (schedule: StudySchedule, fallbackStart: string): StudySchedule => {
  const start = schedule.slots.at(-1)?.end ?? fallbackStart;
  return {
    ...schedule,
    slots: [...schedule.slots, { start, end: addMinutesToTime(start, NEW_SLOT_MINUTES) }],
  };
};

export const removeScheduleSlot = (schedule: StudySchedule, index: number): StudySchedule => ({
  ...schedule,
  slots: schedule.slots.filter((_, i) => i !== index),
});

export const updateScheduleSlot = (
  schedule: StudySchedule,
  index: number,
  part: keyof TimeSlot,
  value: string,
): StudySchedule => ({
  ...schedule,
  slots: schedule.slots.map((slot, i) => (i === index ? { ...slot, [part]: value } : slot)),
});
