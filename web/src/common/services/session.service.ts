import { Injectable } from '@angular/core';
import { readStorage, removeStorage, writeStorage } from '../utils/storage';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class SessionService {
  hasSession(): boolean {
    return !!readStorage(TOKEN_KEY);
  }

  start(token: string): void {
    writeStorage(TOKEN_KEY, token);
  }

  end(): void {
    removeStorage(TOKEN_KEY);
  }
}
