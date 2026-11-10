import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
import { NoteDetail, NoteDraft } from '../../common/models/syllabus.model';
import { NotificationService } from '../../common/services/notification.service';
import { NotesService } from '../services/notes.service';

export interface NoteLocation {
  topicId: number;
  noteId: number | null;
}

interface NoteState {
  topicId: number | null;
  note: NoteDetail | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  hasDeleted: boolean;
  error: 'loading' | 'saving' | 'deleting' | null;
}

export const NoteStore = signalStore(
  withState<NoteState>({
    topicId: null,
    note: null,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    hasDeleted: false,
    error: null,
  }),
  withMethods(
    (
      store,
      notesService = inject(NotesService),
      notificationService = inject(NotificationService),
    ) => ({
      load: rxMethod<NoteLocation>(
        pipe(
          tap(({ topicId, noteId }) =>
            patchState(store, {
              topicId,
              note: null,
              isLoading: noteId !== null,
              hasDeleted: false,
              error: null,
            }),
          ),
          map(({ noteId }) => noteId),
          filter((noteId): noteId is number => noteId !== null),
          switchMap((noteId) =>
            notesService.getNote(noteId).pipe(
              tapResponse({
                next: (note) => patchState(store, { note, isLoading: false }),
                error: () => patchState(store, { isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      save: rxMethod<NoteDraft>(
        pipe(
          map((draft) => ({ draft, topicId: store.topicId() })),
          filter((save): save is { draft: NoteDraft; topicId: number } => save.topicId !== null),
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ draft, topicId }) =>
            notesService.saveTextNote(topicId, store.note()?.id ?? null, draft).pipe(
              tapResponse({
                next: (note) => {
                  patchState(store, { note, isSaving: false });
                  notificationService.success('notes.saved');
                },
                error: () => patchState(store, { isSaving: false, error: 'saving' }),
              }),
            ),
          ),
        ),
      ),
      delete: rxMethod<void>(
        pipe(
          map(() => store.note()?.id),
          filter((noteId): noteId is number => noteId !== undefined),
          tap(() => patchState(store, { isDeleting: true, error: null })),
          switchMap((noteId) =>
            notesService.deleteNote(noteId).pipe(
              tapResponse({
                next: () => patchState(store, { isDeleting: false, hasDeleted: true }),
                error: () => patchState(store, { isDeleting: false, error: 'deleting' }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
