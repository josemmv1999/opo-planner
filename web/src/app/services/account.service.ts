import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Credentials } from '../../common/models/credentials.model';
import { RegisterData } from '../../common/models/register-data.model';
import { PasswordChange, ProfileData, User } from '../../common/models/user.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  readonly #http = inject(HttpClient);

  login(credentials: Credentials): Observable<User> {
    return this.#http.post<User>('/api/auth/login', credentials);
  }

  register(data: RegisterData): Observable<User> {
    return this.#http.post<User>('/api/auth/register', data);
  }

  logout(): Observable<void> {
    return this.#http.post<void>('/api/auth/logout', null);
  }

  getCurrentUser(): Observable<User> {
    return this.#http.get<User>('/api/auth/me');
  }

  changePassword(change: PasswordChange): Observable<void> {
    return this.#http.put<void>('/api/account/password', change);
  }

  updateProfile(profile: ProfileData): Observable<ProfileData> {
    return this.#http.put<ProfileData>('/api/account/profile', profile);
  }
}
