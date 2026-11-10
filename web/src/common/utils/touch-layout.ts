import { Signal, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map } from 'rxjs';
import { InterfaceMode } from '../models/onboarding.model';

const INTERFACE_MODE_KEY = 'interfaceMode';
const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)';
const NARROW_QUERY = '(max-width: 991.98px)';

const readStoredMode = (): InterfaceMode | null => {
  try {
    const mode = localStorage.getItem(INTERFACE_MODE_KEY);
    return mode === 'desktop' || mode === 'touch' ? mode : null;
  } catch {
    return null;
  }
};

const mediaQuerySignal = (query: string): Signal<boolean> => {
  const mediaQuery = matchMedia(query);
  return toSignal(fromEvent(mediaQuery, 'change').pipe(map(() => mediaQuery.matches)), {
    initialValue: mediaQuery.matches,
  });
};

export const injectIsTouchLayout = (): Signal<boolean> => {
  const storedMode = readStoredMode();
  const isTouchDevice = storedMode
    ? signal(storedMode === 'touch').asReadonly()
    : mediaQuerySignal(TOUCH_DEVICE_QUERY);
  const isNarrow = mediaQuerySignal(NARROW_QUERY);
  return computed(() => isNarrow() || isTouchDevice());
};
