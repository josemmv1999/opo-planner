import { Injectable } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { OnboardingData, OppositionOption } from '../../common/models/onboarding.model';
import { OPPOSITION_CATALOG } from './mock-oppositions';
import {
  INTERFACE_MODE_KEY,
  MOCK_ONBOARDING_KEY,
  MOCK_OPPOSITION_IDS_KEY,
  writeJson,
  writeStorage,
} from './mock-storage';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  getOppositions(): Observable<OppositionOption[]> {
    return of(OPPOSITION_CATALOG).pipe(delay(400));
  }

  save(data: OnboardingData): Observable<void> {
    return of(undefined).pipe(
      delay(800),
      tap(() => {
        writeStorage(MOCK_ONBOARDING_KEY, 'true');
        writeJson(MOCK_OPPOSITION_IDS_KEY, data.oppositionIds);
        if (data.interfaceMode) writeStorage(INTERFACE_MODE_KEY, data.interfaceMode);
      }),
    );
  }
}
