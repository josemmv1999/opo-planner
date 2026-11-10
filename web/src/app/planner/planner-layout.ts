import { TimeSlot } from '../../common/models/onboarding.model';
import { PlacedEntry, PlannerEntry, RowRange } from '../../common/models/planner.model';

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

export const placeEntries = (entries: PlannerEntry[]): PlacedEntry[] => {
  const laneEnds: number[] = [];
  return [...entries]
    .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end))
    .map((entry) => {
      const range = toRowRange(dateMinutes(entry.start), dateMinutes(entry.end));
      const freeLane = laneEnds.findIndex((end) => end <= range.startRow);
      const lane = freeLane === -1 ? laneEnds.length : freeLane;
      laneEnds[lane] = range.endRow;
      return { ...entry, ...range, lane, isShort: range.endRow - range.startRow <= SHORT_ROWS };
    });
};
