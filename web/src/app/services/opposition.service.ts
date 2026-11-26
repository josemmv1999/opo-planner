import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { OppositionOption } from '../../common/models/onboarding.model';
import { Opposition } from '../../common/models/opposition.model';
import { removeStorage } from '../../common/utils/storage';
import { VISIBLE_OPPOSITIONS } from './mock-oppositions';

const URL = '/api/account/oppositions';
const DEFAULT_OPPOSITION_IDS = ['age-c1'];
const OLD_KEYS = ['mockOppositionIds', 'mockActiveOppositionId'];

interface UserOppositions {
  ids: string[] | null;
  activeId: string | null;
}

const toOpposition = ({ id, level, name }: OppositionOption): Opposition => ({
  id,
  abbreviation: level,
  name,
});

@Injectable({ providedIn: 'root' })
export class OppositionService {
  readonly #http = inject(HttpClient);

  constructor() {
    OLD_KEYS.forEach(removeStorage);
  }

  getActiveOpposition(): Observable<Opposition> {
    return this.#get().pipe(
      map(({ ids, activeId }) => {
        const active =
          VISIBLE_OPPOSITIONS.find(({ id }) => id === activeId && ids.includes(id)) ??
          VISIBLE_OPPOSITIONS.find(({ id }) => id === ids[0]) ??
          VISIBLE_OPPOSITIONS[0];
        return toOpposition(active);
      }),
    );
  }

  getUserOppositions(): Observable<Opposition[]> {
    return this.getUserOppositionIds().pipe(
      map((ids) => VISIBLE_OPPOSITIONS.filter(({ id }) => ids.includes(id)).map(toOpposition)),
    );
  }

  getUserOppositionIds(): Observable<string[]> {
    return this.#get().pipe(map(({ ids }) => ids));
  }

  removeOpposition(oppositionId: string): Observable<string[]> {
    return this.getUserOppositionIds().pipe(
      switchMap((ids) => this.saveOppositions(ids.filter((id) => id !== oppositionId))),
    );
  }

  addOppositions(oppositionIds: string[]): Observable<string[]> {
    return this.getUserOppositionIds().pipe(
      switchMap((ids) => this.saveOppositions([...ids, ...oppositionIds])),
    );
  }

  saveOppositions(oppositionIds: string[]): Observable<string[]> {
    return this.#http
      .put<UserOppositions>(URL, { ids: oppositionIds })
      .pipe(map(({ ids }) => ids ?? DEFAULT_OPPOSITION_IDS));
  }

  setActiveOpposition(oppositionId: string): Observable<Opposition> {
    const opposition = VISIBLE_OPPOSITIONS.find(({ id }) => id === oppositionId);
    if (!opposition) throw new Error('Unknown opposition');
    return this.#http
      .put<UserOppositions>(`${URL}/active`, { id: oppositionId })
      .pipe(map(() => toOpposition(opposition)));
  }

  #get(): Observable<{ ids: string[]; activeId: string | null }> {
    return this.#http
      .get<UserOppositions>(URL)
      .pipe(map(({ ids, activeId }) => ({ ids: ids ?? DEFAULT_OPPOSITION_IDS, activeId })));
  }
}
