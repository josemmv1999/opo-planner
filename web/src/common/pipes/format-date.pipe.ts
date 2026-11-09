import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

@Pipe({ name: 'formatDate' })
export class FormatDatePipe implements PipeTransform {
  transform(value: string, pattern: string): string {
    return format(parseISO(value), pattern, { locale: es });
  }
}
