import { Injectable } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { OnboardingData, OppositionOption } from '../../common/models/onboarding.model';
import { INTERFACE_MODE_KEY, MOCK_ONBOARDING_KEY, writeStorage } from './mock-storage';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  getOppositions(): Observable<OppositionOption[]> {
    return of<OppositionOption[]>([
      {
        id: 'age-c1',
        level: 'C1',
        name: 'Administrativo de la AGE',
        body: 'Administración General del Estado',
      },
      {
        id: 'age-c2',
        level: 'C2',
        name: 'Auxiliar Administrativo de la AGE',
        body: 'Administración General del Estado',
      },
      {
        id: 'ss-c1',
        level: 'C1',
        name: 'Administrativo de la Seguridad Social',
        body: 'Seguridad Social',
      },
      {
        id: 'ss-c2',
        level: 'C2',
        name: 'Auxiliar Administrativo de la Seguridad Social',
        body: 'Seguridad Social',
      },
    ]).pipe(delay(400));
  }

  save(data: OnboardingData): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        writeStorage(MOCK_ONBOARDING_KEY, 'true');
        if (data.interfaceMode) writeStorage(INTERFACE_MODE_KEY, data.interfaceMode);
      }),
    );
  }
}
