import { Injectable, Signal, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map } from 'rxjs';
import { InterfaceMode } from '../models/onboarding.model';
import { readStorage, removeStorage, writeStorage } from '../utils/storage';

export const INTERFACE_MODE_KEY = 'interfaceMode';
const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)';
const NARROW_QUERY = '(max-width: 991.98px)';

const readStoredMode = (): InterfaceMode | null => {
  const mode = readStorage(INTERFACE_MODE_KEY);
  return mode === 'desktop' || mode === 'touch' ? mode : null;
};

const storeMode = (mode: InterfaceMode | null): void =>
  mode ? writeStorage(INTERFACE_MODE_KEY, mode) : removeStorage(INTERFACE_MODE_KEY);

const mediaQuerySignal = (query: string): Signal<boolean> => {
  const mediaQuery = matchMedia(query);
  return toSignal(fromEvent(mediaQuery, 'change').pipe(map(() => mediaQuery.matches)), {
    initialValue: mediaQuery.matches,
  });
};

@Injectable({ providedIn: 'root' })
export class InterfaceModeService {
  readonly #mode = signal(readStoredMode());
  readonly #isTouchDevice = mediaQuerySignal(TOUCH_DEVICE_QUERY);
  readonly #isNarrow = mediaQuerySignal(NARROW_QUERY);

  readonly mode = this.#mode.asReadonly();
  readonly detectedMode = computed<InterfaceMode>(() =>
    this.#isTouchDevice() ? 'touch' : 'desktop',
  );
  readonly isTouchLayout = computed(
    () => this.#isNarrow() || (this.#mode() ?? this.detectedMode()) === 'touch',
  );

  setMode(mode: InterfaceMode | null): void {
    this.#mode.set(mode);
    storeMode(mode);
  }
}
