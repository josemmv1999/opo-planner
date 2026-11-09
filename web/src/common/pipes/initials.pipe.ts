import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../models/user.model';

@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform({ name, surname }: User): string {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  }
}
