import { differenceInCalendarDays } from 'date-fns';

export const journeyPercentage = (start: Date, end: Date, now: Date): number => {
  const totalDays = differenceInCalendarDays(end, start);
  if (totalDays <= 0) return 100;
  const percentage = (differenceInCalendarDays(now, start) / totalDays) * 100;
  return Math.round(Math.min(100, Math.max(0, percentage)));
};
