import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NoteDetail,
  NoteDraft,
  PdfHighlight,
  HighlightChange,
  HighlightColor,
  MarginNoteChange,
  MarginNoteDraft,
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
            addHighlight: (_: number, draft: PdfHighlightDraft, color: HighlightColor) =>
              of({ ...draft, id: 2, note: '', color }),
            updateHighlight: (_: number, id: number, change: HighlightChange) =>
              of({ ...HIGHLIGHT, id, ...change }),
            deleteAnnotation: (_: number, id: number) => of(id),
          },
        },
        { provide: NotificationService, useValue: { success: vi.fn() } },
      ],
    });
    store = TestBed.inject(NoteStore);
  });

  it('loads the highlights of a note and saves the selected text as a new one', () => {
    store.load({ topicId: 1, noteId: 7 });
    expect(store.highlights()).toEqual([HIGHLIGHT]);
    const selection = { page: 3, text: 'Título I', rects: [{ x: 5, y: 5, width: 20, height: 2 }] };
    store.select(selection);
    store.setHighlightColor('green');
    store.highlight();
    expect(store.highlights()).toEqual([
      HIGHLIGHT,
      { ...selection, id: 2, note: '', color: 'green' },
    ]);
    expect(store.selection()).toBeNull();
  });

  it('writes a note and changes the color of a highlight, then closes it', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.openHighlight(1);
    expect(store.openedHighlight()).toEqual(HIGHLIGHT);
    store.saveHighlight({ note: 'Cae en el examen', color: 'pink' });
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

  it('removes the opened highlight', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.openHighlight(1);
    store.deleteHighlight();
    expect(store.highlights()).toEqual([]);
    expect(store.openedHighlight()).toBeNull();
  });

  it('ignores a highlight without selected text', () => {
    store.load({ topicId: 1, noteId: 7 });
    store.highlight();
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
