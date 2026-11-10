import { Pipe, PipeTransform } from '@angular/core';

const pad = (value: number): string => String(value).padStart(2, '0');

@Pipe({ name: 'countdown' })
export class CountdownPipe implements PipeTransform {
  transform(seconds: number): string {
    return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  }
}
