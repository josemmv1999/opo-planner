import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { OppositionOption } from '../../common/models/onboarding.model';
import { Opposition } from '../../common/models/opposition.model';
import {
  MOCK_ACTIVE_OPPOSITION_KEY,
  MOCK_OPPOSITION_IDS_KEY,
  readJson,
  writeJson,
} from './mock-storage';
import { OPPOSITION_CATALOG } from './mock-oppositions';

const DEFAULT_OPPOSITION_IDS = ['age-c2'];

const toOpposition = ({ id, level, name }: OppositionOption): Opposition => ({
  id,
  abbreviation: level,
  name,
});

@Injectable({ providedIn: 'root' })
export class OppositionService {
  getActiveOpposition(): Observable<Opposition> {
    const ids = this.#userIds();
    const activeId = readJson<string>(MOCK_ACTIVE_OPPOSITION_KEY);
    const active =
      OPPOSITION_CATALOG.find(({ id }) => id === activeId && ids.includes(id)) ??
      OPPOSITION_CATALOG.find(({ id }) => id === ids[0]) ??
      OPPOSITION_CATALOG[0];
    return of(toOpposition(active)).pipe(delay(800));
  }

  getUserOppositions(): Observable<Opposition[]> {
    const ids = this.#userIds();
    return of(OPPOSITION_CATALOG.filter(({ id }) => ids.includes(id)).map(toOpposition)).pipe(
      delay(300),
    );
  }

  getUserOppositionIds(): Observable<string[]> {
    return of(this.#userIds()).pipe(delay(300));
  }

  addOppositions(oppositionIds: string[]): Observable<string[]> {
    const updated = [...new Set([...this.#userIds(), ...oppositionIds])];
    writeJson(MOCK_OPPOSITION_IDS_KEY, updated);
    return of(updated).pipe(delay(500));
  }

  setActiveOpposition(oppositionId: string): Observable<Opposition> {
    const opposition = OPPOSITION_CATALOG.find(({ id }) => id === oppositionId);
    if (!opposition) throw new Error('Unknown opposition');
    writeJson(MOCK_ACTIVE_OPPOSITION_KEY, oppositionId);
    return of(toOpposition(opposition)).pipe(delay(400));
  }

  #userIds(): string[] {
    return readJson<string[]>(MOCK_OPPOSITION_IDS_KEY) ?? DEFAULT_OPPOSITION_IDS;
  }
}
