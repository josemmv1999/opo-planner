import { TimeSlot } from '../../common/models/onboarding.model';
import {
  CalendarEntry,
  OtherPlannerEntry,
  PlacedEntry,
  RowRange,
  TaskDraft,
} from '../../common/models/planner.model';

export const FIRST_HOUR = 7;
export const LAST_HOUR = 23;
export const ROW_MINUTES = 15;
export const ROW_COUNT = ((LAST_HOUR - FIRST_HOUR) * 60) / ROW_MINUTES;
export const ROWS_PER_HOUR = 60 / ROW_MINUTES;
export const HOUR_LABELS = Array.from(
  { length: LAST_HOUR - FIRST_HOUR },
  (_, i) => `${String(FIRST_HOUR + i).padStart(2, '0')}:00`,
);

const SHORT_ROWS = 2;
const SLOT_MINUTES = 30;
export const ROWS_PER_SLOT = SLOT_MINUTES / ROW_MINUTES;

const toRow = (minutes: number, round: (value: number) => number): number =>
  Math.min(Math.max(round((minutes - FIRST_HOUR * 60) / ROW_MINUTES), 0), ROW_COUNT) + 1;

const dateMinutes = (iso: string): number => {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
};

const timeMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const toRowRange = (startMinutes: number, endMinutes: number): RowRange => {
  const startRow = toRow(startMinutes, Math.floor);
  return { startRow, endRow: Math.max(toRow(endMinutes, Math.ceil), startRow + 1) };
};

export const slotRows = (slots: TimeSlot[]): RowRange[] =>
  slots.map(({ start, end }) => toRowRange(timeMinutes(start), timeMinutes(end)));

interface Placement extends RowRange {
  lane: number;
  slot: number;
  group: { size: number };
}

export const placeEntries = (entries: CalendarEntry[]): PlacedEntry[] => {
  const placements: Placement[] = [];
  return [...entries]
    .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end))
    .map((entry) => {
      const { startRow, endRow } = toRowRange(dateMinutes(entry.start), dateMinutes(entry.end));
      const range = { startRow, endRow: Math.max(endRow, startRow + SHORT_ROWS) };
      const overlapping = placements.filter(
        (other) => other.startRow < range.endRow && range.startRow < other.endRow,
      );
      const sibling = overlapping.find(
        (other) => Math.abs(other.startRow - range.startRow) < SHORT_ROWS,
      );
      const placement: Placement = sibling
        ? { ...range, lane: sibling.lane, slot: sibling.group.size++, group: sibling.group }
        : {
            ...range,
            lane: Math.max(-1, ...overlapping.map(({ lane }) => lane)) + 1,
            slot: 0,
            group: { size: 1 },
          };
      placements.push(placement);
      return { entry, placement };
    })
    .map(({ entry, placement: { startRow, endRow, lane, slot, group } }) => ({
      ...entry,
      startRow,
      endRow,
      lane,
      slot,
      slots: group.size,
      isShort: endRow - startRow <= SHORT_ROWS,
    }));
};

const toTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const slotStartAt = (fraction: number): string => {
  const slots = ((LAST_HOUR - FIRST_HOUR) * 60) / SLOT_MINUTES;
  return toTime(FIRST_HOUR * 60 + Math.min(Math.floor(fraction * slots), slots - 1) * SLOT_MINUTES);
};

export const rowTime = (row: number): string => toTime(FIRST_HOUR * 60 + (row - 1) * ROW_MINUTES);

export const findClash = (
  { date, start, end }: TaskDraft,
  entries: OtherPlannerEntry[],
): OtherPlannerEntry | null => {
  if (!date || !start || !end || end <= start) return null;
  const [from, to] = [new Date(`${date}T${start}`), new Date(`${date}T${end}`)];
  return entries.find((entry) => new Date(entry.start) < to && from < new Date(entry.end)) ?? null;
};
