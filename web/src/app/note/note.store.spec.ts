import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NoteDetail,
  NoteDraft,
  PdfHighlight,
  HighlightMark,
  HighlightUpdate,
  MarginNoteChange,
  MarginNoteDraft,
  MarginNoteMove,
  PdfHighlightDraft,
} from '../../common/models/syllabus.model';
import { NotificationService } from '../../common/services/notification.service';
import { NotesService } from '../services/notes.service';
import { NoteStore } from './note.store';

const NOTE: NoteDetail = {
  id: 7,
  topicId: 1,
  title: 'Esquema',
  kind: 'text',
  updatedAt: '2026-11-10',
  content: '<p>Hola</p>',
  fileUrl: null,
};

const HIGHLIGHT: PdfHighlight = {
  id: 1,
  page: 2,
  text: 'Artículo 1',
  rects: [{ x: 10, y: 20, width: 30, height: 2 }],
  note: '',
  color: 'yellow',
  style: 'highlight',
};

describe('NoteStore', () => {
  let store: InstanceType<typeof NoteStore>;
  const saveTextNote = vi.fn((topicId: number, noteId: number | null, draft: NoteDraft) =>
    of<NoteDetail>({ ...NOTE, id: noteId ?? 8, topicId, ...draft }),
  );
  const getNote = vi.fn((noteId: number) =>
    noteId === NOTE.id ? of(NOTE) : throwError(() => new Error('missing')),
  );

  beforeEach(() => {
    saveTextNote.mockClear();
    TestBed.configureTestingModule({
      providers: [
        NoteStore,
        {
          provide: NotesService,
          useValue: {
            getNote,
            saveTextNote,
            deleteNote: (id: number) => of(id),
            getTopicNotes: () => of([]),
            getLastPage: () => 3,
            setLastPage: vi.fn(),
            getAnnotations: () => of({ highlights: [HIGHLIGHT], marginNotes: [] }),
            addMarginNote: (_: number, draft: MarginNoteDraft, change: MarginNoteChange) =>
              of({ ...draft, ...change, id: 5 }),
            updateMarginNote: (_: number, id: number, change: MarginNoteChange) =>
              of({ page: 1, y: 30, side: 'left', ...change, id }),
            moveMarginNote: (_: number, move: MarginNoteMove) =>
              move.y > 90
                ? throwError(() => new Error('failed'))
                : of({ page: 1, text: 'Ojo', color: 'blue', ...move }),
            addHighlight: (_: number, draft: PdfHighlightDraft, mark: HighlightMark) =>
              of({ ...draft, ...mark, id: 2, note: '' }),
            updateHighlight: (_: number, update: HighlightUpdate) =>
              of({ ...HIGHLIGHT, ...update }),
            deleteAnnotation: (_: number, id: number) => of(id),
          },
        },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    store = TestBed.inject(NoteStore);
  });

  it('loads the highlights of a note and saves the selected text as a new one', () => {
    store.load({ topicId: 1, noteId: 7 });
    expect(store.highlights()).toEqual([HIGHLIGHT]);
    const selection = { page: 3, text: 'Título I', rects: [{ x: 5, y: 5, width: 20, height: 2 }] };
    store.select(selection);
    store.highlight({ color: 'green', style: 'underline' });
    expect(store.highlights()).toEqual([
      HIGHLIGHT,
      { ...selection, id: 2, note: '', color: 'green', style: 'underline' },
    ]);
    expect(store.selection()).toBeNull();
    expect(store.openedHighlightId()).toBeNull();
  });

  it('highlights the selected text and opens it to write a comment', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.select({ page: 1, text: 'Plazo', rects: [{ x: 5, y: 5, width: 20, height: 2 }] });
    store.highlight({ color: 'yellow', style: 'highlight', isCommenting: true });
    expect(store.openedHighlight()).toMatchObject({ id: 2, text: 'Plazo' });
  });

  it('changes the color and the style of a highlight from the menu', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.saveHighlight({ id: 1, color: 'blue', style: 'underline' });
    expect(store.highlights()[0]).toMatchObject({ color: 'blue', style: 'underline', note: '' });
  });

  it('writes a note and changes the color of a highlight, then closes it', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.openHighlight(1);
    expect(store.openedHighlight()).toEqual(HIGHLIGHT);
    store.saveHighlight({ id: 1, note: 'Cae en el examen', color: 'pink' });
    expect(store.highlights()[0]).toMatchObject({ note: 'Cae en el examen', color: 'pink' });
    expect(store.openedHighlightId()).toBeNull();
  });

  it('adds a margin note, edits it and deletes it', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.startMarginNote({ page: 1, y: 30, side: 'left' });
    expect(store.isMarginFormOpen()).toBe(true);
    store.saveMarginNote({ text: 'Ojo', color: 'blue' });
    expect(store.marginNotes()).toEqual([
      { page: 1, y: 30, side: 'left', text: 'Ojo', color: 'blue', id: 5 },
    ]);
    expect(store.isMarginFormOpen()).toBe(false);

    store.openMarginNote(5);
    store.saveMarginNote({ text: 'Ojo al plazo', color: 'pink' });
    expect(store.marginNotes()[0]).toMatchObject({ text: 'Ojo al plazo', color: 'pink' });

    store.openMarginNote(5);
    store.deleteMarginNote();
    expect(store.marginNotes()).toEqual([]);
  });

  it('moves a margin note and puts it back if the move fails', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.startMarginNote({ page: 1, y: 30, side: 'left' });
    store.saveMarginNote({ text: 'Ojo', color: 'blue' });

    store.moveMarginNote({ id: 5, y: 60, side: 'right' });
    expect(store.marginNotes()[0]).toMatchObject({ y: 60, side: 'right', text: 'Ojo' });

    store.moveMarginNote({ id: 5, y: 99, side: 'left' });
    expect(store.marginNotes()[0]).toMatchObject({ y: 60, side: 'right' });
    expect(store.error()).toBe('highlighting');
  });

  it('removes the opened highlight', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.openHighlight(1);
    store.deleteHighlight(1);
    expect(store.highlights()).toEqual([]);
    expect(store.openedHighlight()).toBeNull();
  });

  it('ignores a highlight without selected text', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.highlight({ color: 'yellow', style: 'highlight' });
    expect(store.highlights()).toEqual([HIGHLIGHT]);
  });

  it('starts a new note in edit mode', () => {
    store.load({ topicId: 1, noteId: null });
    expect(store.note()).toBeNull();
    expect(store.isEditing()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('opens an existing note to read it from the last page', () => {
    store.load({ topicId: 1, noteId: 7 });
    expect(store.isEditing()).toBe(false);
    expect(store.initialPage()).toBe(3);
  });

  it('creates a note and keeps editing the same one', () => {
    store.load({ topicId: 1, noteId: null });
    store.save({ title: 'Nuevo', content: '<p>Texto</p>' });
    expect(store.note()).toMatchObject({ id: 8, topicId: 1, title: 'Nuevo' });
    expect(store.isEditing()).toBe(false);
    expect(store.siblings().map(({ id }) => id)).toEqual([8]);
    store.save({ title: 'Nuevo 2', content: '' });
    expect(saveTextNote).toHaveBeenLastCalledWith(1, 8, { title: 'Nuevo 2', content: '' });
  });

  it('loads a note, deletes it and flags the missing ones', () => {
    store.load({ topicId: 1, noteId: 7 });
    expect(store.note()).toEqual(NOTE);
    store.delete();
    expect(store.hasDeleted()).toBe(true);
    store.load({ topicId: 1, noteId: 99 });
    expect(store.error()).toBe('loading');
  });
});
