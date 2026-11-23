import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import { Credentials } from '../../common/models/credentials.model';
import { RegisterData } from '../../common/models/register-data.model';
import { PasswordChange, ProfileData, User } from '../../common/models/user.model';
import { MOCK_ONBOARDING_KEY, readMockFlag } from './mock-storage';

const withMockOnboarding = (user: User): User => ({
  ...user,
  hasCompletedOnboarding: readMockFlag(MOCK_ONBOARDING_KEY),
});

@Injectable({ providedIn: 'root' })
export class AccountService {
  readonly #http = inject(HttpClient);

  login(credentials: Credentials): Observable<User> {
    return this.#http.post<User>('/api/auth/login', credentials).pipe(map(withMockOnboarding));
  }

  register(data: RegisterData): Observable<User> {
    return this.#http.post<User>('/api/auth/register', data);
  }

  logout(): Observable<void> {
    return this.#http.post<void>('/api/auth/logout', null);
  }

  getCurrentUser(): Observable<User> {
    return this.#http.get<User>('/api/auth/me').pipe(map(withMockOnboarding));
  }

  changePassword({ currentPassword }: PasswordChange): Observable<void> {
    return currentPassword
      ? of(undefined).pipe(delay(600))
      : throwError(() => new Error('Wrong password'));
  }

  updateProfile(profile: ProfileData): Observable<ProfileData> {
    return of(profile).pipe(delay(600));
  }
}
