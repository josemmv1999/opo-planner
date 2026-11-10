import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
import { SyllabusTopicDetail } from '../../common/models/syllabus.model';
import { NotesService } from '../services/notes.service';
import { SyllabusService } from '../services/syllabus.service';

interface SyllabusTopicState {
  topic: SyllabusTopicDetail | null;
  isLoading: boolean;
  isUploading: boolean;
  error: 'loading' | 'uploading' | null;
}

export const SyllabusTopicStore = signalStore(
  withState<SyllabusTopicState>({ topic: null, isLoading: false, isUploading: false, error: null }),
  withMethods(
    (store, syllabusService = inject(SyllabusService), notesService = inject(NotesService)) => ({
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
      uploadPdf: rxMethod<File>(
        pipe(
          map((file) => ({ file, topicId: store.topic()?.id })),
          filter(
            (upload): upload is { file: File; topicId: number } => upload.topicId !== undefined,
          ),
          tap(() => patchState(store, { isUploading: true, error: null })),
          switchMap(({ file, topicId }) =>
            notesService.uploadPdf(topicId, file).pipe(
              tapResponse({
                next: (note) =>
                  patchState(store, ({ topic }) => ({
                    topic: topic && { ...topic, notes: [...topic.notes, note] },
                    isUploading: false,
                  })),
                error: () => patchState(store, { isUploading: false, error: 'uploading' }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
