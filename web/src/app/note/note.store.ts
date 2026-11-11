import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';
import { NoteDetail, NoteDraft, TopicNote } from '../../common/models/syllabus.model';
import { NotificationService } from '../../common/services/notification.service';
import { NotesService } from '../services/notes.service';

export interface NoteLocation {
  topicId: number;
  noteId: number | null;
}

interface NoteState {
  topicId: number | null;
  note: NoteDetail | null;
  siblings: TopicNote[];
  initialPage: number;
  isEditing: boolean;
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
    siblings: [],
    initialPage: 1,
    isEditing: false,
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
          tap(({ topicId }) =>
            patchState(store, { topicId, isLoading: true, hasDeleted: false, error: null }),
          ),
          switchMap(({ topicId, noteId }) =>
            forkJoin({
              note: noteId === null ? of(null) : notesService.getNote(noteId),
              siblings: notesService.getTopicNotes(topicId),
            }).pipe(
              tapResponse({
                next: ({ note, siblings }) =>
                  patchState(store, {
                    note,
                    siblings,
                    initialPage: note ? notesService.getLastPage(note.id) : 1,
                    isEditing: note === null,
                    isLoading: false,
                  }),
                error: () => patchState(store, { note: null, isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      startEditing(): void {
        patchState(store, { isEditing: true, error: null });
      },
      cancelEditing(): void {
        patchState(store, { isEditing: false, error: null });
      },
      rememberPage(page: number): void {
        const noteId = store.note()?.id;
        if (noteId !== undefined) notesService.setLastPage(noteId, page);
      },
      save: rxMethod<NoteDraft>(
        pipe(
          map((draft) => ({ draft, topicId: store.topicId() })),
          filter((save): save is { draft: NoteDraft; topicId: number } => save.topicId !== null),
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ draft, topicId }) =>
            notesService.saveTextNote(topicId, store.note()?.id ?? null, draft).pipe(
              tapResponse({
                next: (note) => {
                  patchState(store, ({ siblings }) => ({
                    note,
                    siblings: siblings.some(({ id }) => id === note.id)
                      ? siblings.map((sibling) =>
                          sibling.id === note.id ? { ...sibling, title: note.title } : sibling,
                        )
                      : [...siblings, note],
                    isEditing: false,
                    isSaving: false,
                  }));
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
