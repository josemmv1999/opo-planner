import { ValidatorFn } from '@angular/forms';

export const passwordValidator: ValidatorFn = ({ value }) =>
  !value || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value) ? null : { password: true };
