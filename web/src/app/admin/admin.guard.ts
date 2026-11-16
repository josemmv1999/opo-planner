import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AccountService } from '../services/account.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AccountService)
    .getCurrentUser()
    .pipe(map(({ isAdmin }) => isAdmin || router.createUrlTree(['/home'])));
};
