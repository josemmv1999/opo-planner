import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Opposition } from '../../common/models/opposition.model';

@Injectable({ providedIn: 'root' })
export class OppositionService {
  getActiveOpposition(): Observable<Opposition> {
    return of({ abbreviation: 'C2', name: 'Auxiliar Administrativo del Estado' }).pipe(delay(800));
  }
}
