import { AbstractControl } from '@angular/forms';

export const validationErrorKey = ({ touched, errors }: AbstractControl): string => {
  const [error] = Object.keys(errors ?? {});
  return touched && error ? `validation.${error}` : '';
};
