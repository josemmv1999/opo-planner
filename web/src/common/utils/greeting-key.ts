import { getHours } from 'date-fns';

export const greetingKeyFor = (date: Date): string => {
  const hour = getHours(date);
  if (hour >= 6 && hour <= 13) return 'home.greeting.morning';
  if (hour >= 14 && hour <= 20) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
};
