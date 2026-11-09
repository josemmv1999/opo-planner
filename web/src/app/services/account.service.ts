import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Credentials } from '../../common/models/credentials.model';
import { RegisterData } from '../../common/models/register-data.model';
import { User } from '../../common/models/user.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  getToken(credentials: Credentials): Observable<string> {
    return of(`mock-token-${credentials.email}`).pipe(delay(800));
  }

  register(data: RegisterData): Observable<RegisterData> {
    return of(data).pipe(delay(800));
  }

  getCurrentUser(): Observable<User> {
    return of({ name: 'Ana', surname: 'García López', email: 'ana@example.com' }).pipe(delay(800));
  }
}
