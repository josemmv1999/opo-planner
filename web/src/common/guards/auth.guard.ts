import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const TOKEN_KEY = 'token';

const hasSession = (): boolean => !!localStorage.getItem(TOKEN_KEY);

export const authGuard: CanActivateFn = () =>
  hasSession() || inject(Router).createUrlTree(['/login']);

export const guestGuard: CanActivateFn = () =>
  !hasSession() || inject(Router).createUrlTree(['/home']);
