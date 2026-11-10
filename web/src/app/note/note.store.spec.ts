import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteDetail, NoteDraft } from '../../common/models/syllabus.model';
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
          useValue: { getNote, saveTextNote, deleteNote: (id: number) => of(id) },
        },
        { provide: NotificationService, useValue: { success: vi.fn() } },
      ],
    });
    store = TestBed.inject(NoteStore);
  });

  it('starts a new note without loading anything', () => {
    store.load({ topicId: 1, noteId: null });
    expect(store.note()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  it('creates a note and keeps editing the same one', () => {
    store.load({ topicId: 1, noteId: null });
    store.save({ title: 'Nuevo', content: '<p>Texto</p>' });
    expect(store.note()).toMatchObject({ id: 8, topicId: 1, title: 'Nuevo' });
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
