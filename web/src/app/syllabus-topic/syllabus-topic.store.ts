import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { SyllabusTopicDetail } from '../../common/models/syllabus.model';
import { SyllabusService } from '../services/syllabus.service';

interface SyllabusTopicState {
  topic: SyllabusTopicDetail | null;
  isLoading: boolean;
  error: 'loading' | null;
}

export const SyllabusTopicStore = signalStore(
  withState<SyllabusTopicState>({ topic: null, isLoading: false, error: null }),
  withMethods((store, syllabusService = inject(SyllabusService)) => ({
    load: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((topicId) =>
          syllabusService.getTopic(topicId).pipe(
            tapResponse({
              next: (topic) => patchState(store, { topic, isLoading: false }),
              error: () => patchState(store, { topic: null, isLoading: false, error: 'loading' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
