import { Injectable } from '@angular/core';
import { readStorage, removeStorage, writeStorage } from '../utils/storage';

const SESSION_KEY = 'hasSession';

@Injectable({ providedIn: 'root' })
export class SessionService {
  hasSession(): boolean {
    return !!readStorage(SESSION_KEY);
  }

  start(): void {
    writeStorage(SESSION_KEY, 'true');
  }

  end(): void {
    removeStorage(SESSION_KEY);
  }
}
