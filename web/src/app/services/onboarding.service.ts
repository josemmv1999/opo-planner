import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { OnboardingData, OppositionOption } from '../../common/models/onboarding.model';
import { OPPOSITION_CATALOG } from './mock-oppositions';
import { INTERFACE_MODE_KEY } from '../../common/services/interface-mode.service';
import { writeStorage } from '../../common/utils/storage';
import { MOCK_OPPOSITION_IDS_KEY, writeJson } from './mock-storage';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  readonly #http = inject(HttpClient);

  getOppositions(): Observable<OppositionOption[]> {
    return of(OPPOSITION_CATALOG).pipe(delay(400));
  }

  save(data: OnboardingData): Observable<void> {
    return this.#http.post<void>('/api/account/onboarding', null).pipe(
      tap(() => {
        writeJson(MOCK_OPPOSITION_IDS_KEY, data.oppositionIds);
        if (data.interfaceMode) writeStorage(INTERFACE_MODE_KEY, data.interfaceMode);
      }),
    );
  }
}
