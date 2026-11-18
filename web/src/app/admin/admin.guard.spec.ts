import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { User } from '../../common/models/user.model';
import { AccountService } from '../services/account.service';
import { adminGuard } from './admin.guard';

const USER: User = {
  name: 'Alba',
  surname: 'Ruiz',
  email: 'alba@example.com',
  hasCompletedOnboarding: true,
  isAdmin: true,
};

const runGuard = (user: User): Promise<boolean | UrlTree> => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AccountService, useValue: { getCurrentUser: () => of(user) } },
    ],
  });
  return firstValueFrom(
    TestBed.runInInjectionContext(
      () => adminGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
    ),
  );
};

describe('adminGuard', () => {
  it('lets an admin in', async () => {
    expect(await runGuard(USER)).toBe(true);
  });

  it('sends anyone else home', async () => {
    const result = await runGuard({ ...USER, isAdmin: false });
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/home');
  });
});
