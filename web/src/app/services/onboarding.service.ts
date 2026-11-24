import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, switchMap, tap } from 'rxjs';
import { OnboardingData, OppositionOption } from '../../common/models/onboarding.model';
import { OPPOSITION_CATALOG } from './mock-oppositions';
import { INTERFACE_MODE_KEY } from '../../common/services/interface-mode.service';
import { writeStorage } from '../../common/utils/storage';
import { OppositionService } from './opposition.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  readonly #http = inject(HttpClient);
  readonly #oppositionService = inject(OppositionService);

  getOppositions(): Observable<OppositionOption[]> {
    return of(OPPOSITION_CATALOG).pipe(delay(400));
  }

  save(data: OnboardingData): Observable<void> {
    return this.#oppositionService.saveOppositions(data.oppositionIds).pipe(
      switchMap(() => this.#http.post<void>('/api/account/onboarding', null)),
      tap(() => {
        if (data.interfaceMode) writeStorage(INTERFACE_MODE_KEY, data.interfaceMode);
      }),
      map(() => undefined),
    );
  }
}
