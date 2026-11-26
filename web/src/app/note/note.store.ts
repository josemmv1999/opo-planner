import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, filter, forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';
import {
  NoteDetail,
  NoteDraft,
  HighlightMark,
  HighlightUpdate,
  MarginNote,
  MarginNoteChange,
  MarginNoteDraft,
  MarginNoteMove,
  PdfHighlight,
  PdfHighlightDraft,
  TopicNote,
} from '../../common/models/syllabus.model';
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
  highlights: PdfHighlight[];
  marginNotes: MarginNote[];
  marginDraft: MarginNoteDraft | null;
  openedMarginNoteId: number | null;
  isSavingMarginNote: boolean;
  isDeletingMarginNote: boolean;
  selection: PdfHighlightDraft | null;
  openedHighlightId: number | null;
  initialPage: number;
  isEditing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isHighlighting: boolean;
  isSavingHighlight: boolean;
  isDeletingHighlight: boolean;
  hasDeleted: boolean;
  error: 'loading' | 'saving' | 'deleting' | 'highlighting' | null;
}

const withMarginNote =
  (changed: MarginNote) =>
  ({ marginNotes }: NoteState): Pick<NoteState, 'marginNotes'> => ({
    marginNotes: marginNotes.map((marginNote) =>
      marginNote.id === changed.id ? changed : marginNote,
    ),
  });

export const NoteStore = signalStore(
  withState<NoteState>({
    topicId: null,
    note: null,
    siblings: [],
    highlights: [],
    marginNotes: [],
    marginDraft: null,
    openedMarginNoteId: null,
    isSavingMarginNote: false,
    isDeletingMarginNote: false,
    selection: null,
    openedHighlightId: null,
    initialPage: 1,
    isEditing: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    isHighlighting: false,
    isSavingHighlight: false,
    isDeletingHighlight: false,
    hasDeleted: false,
    error: null,
  }),
  withComputed(
    ({ highlights, openedHighlightId, marginNotes, openedMarginNoteId, marginDraft }) => ({
      openedHighlight: computed(
        () => highlights().find(({ id }) => id === openedHighlightId()) ?? null,
      ),
      openedMarginNote: computed(
        () => marginNotes().find(({ id }) => id === openedMarginNoteId()) ?? null,
      ),
      isMarginFormOpen: computed(() => marginDraft() !== null || openedMarginNoteId() !== null),
    }),
  ),
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
              annotations:
                noteId === null
                  ? of({ highlights: [], marginNotes: [] })
                  : notesService.getAnnotations(noteId),
            }).pipe(
              tapResponse({
                next: ({ note, siblings, annotations }) =>
                  patchState(store, {
                    note,
                    siblings,
                    ...annotations,
                    selection: null,
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
      select(selection: PdfHighlightDraft | null): void {
        patchState(store, { selection });
      },
      highlight: rxMethod<HighlightMark & { isCommenting?: boolean }>(
        pipe(
          map(({ isCommenting = false, ...mark }) => ({
            noteId: store.note()?.id,
            selection: store.selection(),
            mark,
            isCommenting,
          })),
          filter(
            (
              pending,
            ): pending is {
              noteId: number;
              selection: PdfHighlightDraft;
              mark: HighlightMark;
              isCommenting: boolean;
            } => pending.noteId !== undefined && pending.selection !== null,
          ),
          tap(() => patchState(store, { isHighlighting: true, error: null })),
          switchMap(({ noteId, selection, mark, isCommenting }) =>
            notesService.addHighlight(noteId, selection, mark).pipe(
              tapResponse({
                next: (highlight) =>
                  patchState(store, ({ highlights }) => ({
                    highlights: [...highlights, highlight],
                    selection: null,
                    openedHighlightId: isCommenting ? highlight.id : null,
                    isHighlighting: false,
                  })),
                error: () => {
                  patchState(store, { isHighlighting: false, error: 'highlighting' });
                  notificationService.error('notes.errors.highlighting');
                },
              }),
            ),
          ),
        ),
      ),
      openHighlight(openedHighlightId: number): void {
        patchState(store, { openedHighlightId });
      },
      closeHighlight(): void {
        patchState(store, { openedHighlightId: null });
      },
      saveHighlight: rxMethod<HighlightUpdate>(
        pipe(
          map((update) => ({ noteId: store.note()?.id, update })),
          filter(
            (pending): pending is { noteId: number; update: HighlightUpdate } =>
              pending.noteId !== undefined,
          ),
          tap(() => patchState(store, { isSavingHighlight: true, error: null })),
          switchMap(({ noteId, update }) =>
            notesService.updateHighlight(noteId, update).pipe(
              tapResponse({
                next: (updated) =>
                  patchState(store, ({ highlights }) => ({
                    highlights: highlights.map((highlight) =>
                      highlight.id === updated.id ? updated : highlight,
                    ),
                    openedHighlightId: null,
                    isSavingHighlight: false,
                  })),
                error: () => {
                  patchState(store, { isSavingHighlight: false, error: 'highlighting' });
                  notificationService.error('notes.errors.highlighting');
                },
              }),
            ),
          ),
        ),
      ),
      deleteHighlight: rxMethod<number>(
        pipe(
          map((highlightId) => ({ noteId: store.note()?.id, highlightId })),
          filter(
            (removal): removal is { noteId: number; highlightId: number } =>
              removal.noteId !== undefined,
          ),
          tap(() => patchState(store, { isDeletingHighlight: true, error: null })),
          switchMap(({ noteId, highlightId }) =>
            notesService.deleteAnnotation(noteId, highlightId).pipe(
              tapResponse({
                next: () =>
                  patchState(store, ({ highlights }) => ({
                    highlights: highlights.filter(({ id }) => id !== highlightId),
                    openedHighlightId: null,
                    isDeletingHighlight: false,
                  })),
                error: () => {
                  patchState(store, { isDeletingHighlight: false, error: 'highlighting' });
                  notificationService.error('notes.errors.highlighting');
                },
              }),
            ),
          ),
        ),
      ),
      startMarginNote(marginDraft: MarginNoteDraft): void {
        patchState(store, { marginDraft, openedMarginNoteId: null });
      },
      openMarginNote(openedMarginNoteId: number): void {
        patchState(store, { openedMarginNoteId, marginDraft: null });
      },
      closeMarginNote(): void {
        patchState(store, { openedMarginNoteId: null, marginDraft: null });
      },
      saveMarginNote: rxMethod<MarginNoteChange>(
        pipe(
          map((change) => ({
            noteId: store.note()?.id,
            opened: store.openedMarginNoteId(),
            draft: store.marginDraft(),
            change,
          })),
          filter(
            (save): save is typeof save & { noteId: number } =>
              save.noteId !== undefined && (save.opened !== null || save.draft !== null),
          ),
          tap(() => patchState(store, { isSavingMarginNote: true, error: null })),
          switchMap(({ noteId, opened, draft, change }) =>
            (opened !== null
              ? notesService.updateMarginNote(noteId, opened, change)
              : notesService.addMarginNote(noteId, draft as MarginNoteDraft, change)
            ).pipe(
              tapResponse({
                next: (saved) =>
                  patchState(store, ({ marginNotes }) => ({
                    marginNotes: marginNotes.some(({ id }) => id === saved.id)
                      ? marginNotes.map((marginNote) =>
                          marginNote.id === saved.id ? saved : marginNote,
                        )
                      : [...marginNotes, saved],
                    openedMarginNoteId: null,
                    marginDraft: null,
                    isSavingMarginNote: false,
                  })),
                error: () => {
                  patchState(store, { isSavingMarginNote: false, error: 'highlighting' });
                  notificationService.error('notes.errors.highlighting');
                },
              }),
            ),
          ),
        ),
      ),
      moveMarginNote: rxMethod<MarginNoteMove>(
        pipe(
          map((move) => ({
            noteId: store.note()?.id,
            previous: store.marginNotes().find(({ id }) => id === move.id),
            move,
          })),
          filter(
            (change): change is typeof change & { noteId: number; previous: MarginNote } =>
              change.noteId !== undefined && change.previous !== undefined,
          ),
          tap(({ previous, move }) =>
            patchState(store, withMarginNote({ ...previous, ...move }), { error: null }),
          ),
          concatMap(({ noteId, previous, move }) =>
            notesService.moveMarginNote(noteId, move).pipe(
              tapResponse({
                next: (saved) => patchState(store, withMarginNote(saved)),
                error: () => {
                  patchState(store, withMarginNote(previous), { error: 'highlighting' });
                  notificationService.error('notes.errors.highlighting');
                },
              }),
            ),
          ),
        ),
      ),
      deleteMarginNote: rxMethod<void>(
        pipe(
          map(() => ({ noteId: store.note()?.id, marginNoteId: store.openedMarginNoteId() })),
          filter(
            (removal): removal is { noteId: number; marginNoteId: number } =>
              removal.noteId !== undefined && removal.marginNoteId !== null,
          ),
          tap(() => patchState(store, { isDeletingMarginNote: true, error: null })),
          switchMap(({ noteId, marginNoteId }) =>
            notesService.deleteAnnotation(noteId, marginNoteId).pipe(
              tapResponse({
                next: () =>
                  patchState(store, ({ marginNotes }) => ({
                    marginNotes: marginNotes.filter(({ id }) => id !== marginNoteId),
                    openedMarginNoteId: null,
                    isDeletingMarginNote: false,
                  })),
                error: () => {
                  patchState(store, { isDeletingMarginNote: false, error: 'highlighting' });
                  notificationService.error('notes.errors.highlighting');
                },
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
                      : [...siblings, { ...note, preview: null }],
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
