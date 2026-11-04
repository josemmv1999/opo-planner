import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Credentials } from '../../common/models/credentials.model';
import { RegisterData } from '../../common/models/register-data.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  getToken(credentials: Credentials): Observable<string> {
    return of(`mock-token-${credentials.email}`).pipe(delay(800));
  }

  register(data: RegisterData): Observable<RegisterData> {
    return of(data).pipe(delay(800));
  }
}
