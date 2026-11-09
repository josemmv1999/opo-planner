import { Pipe, PipeTransform } from '@angular/core';

export interface DayLabels {
  names: string[];
  range: string;
  and: string;
}

const MIN_RANGE_LENGTH = 3;

const isConsecutive = (days: number[]): boolean =>
  days.every((day, i) => i === 0 || day === days[i - 1] + 1);

@Pipe({ name: 'daysLabel' })
export class DaysLabelPipe implements PipeTransform {
  transform(days: number[], labels: DayLabels | string): string {
    if (typeof labels === 'string' || !days.length) return '';
    const names = days.map((day) => labels.names[day]);
    if (days.length >= MIN_RANGE_LENGTH && isConsecutive(days)) {
      return labels.range.replace('{{from}}', names[0]).replace('{{to}}', names[names.length - 1]);
    }
    return names.length > 1
      ? `${names.slice(0, -1).join(', ')}${labels.and}${names[names.length - 1]}`
      : names[0];
  }
}
