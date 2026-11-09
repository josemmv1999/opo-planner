import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map } from 'rxjs';

const ONE_MINUTE = 60_000;

export const injectNow = (): Signal<Date> =>
  toSignal(interval(ONE_MINUTE).pipe(map(() => new Date())), { initialValue: new Date() });
