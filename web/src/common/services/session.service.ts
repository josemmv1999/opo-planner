import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class SessionService {
  hasSession(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  start(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  end(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
