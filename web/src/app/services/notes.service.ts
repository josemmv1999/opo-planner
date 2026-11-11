import { Injectable } from '@angular/core';
import { formatISO } from 'date-fns';
import { Observable, delay, from, map, of, throwError } from 'rxjs';
import { NoteDetail, NoteDraft, TopicNote } from '../../common/models/syllabus.model';
import { readJson, writeJson } from './mock-storage';

const STORAGE_KEY = 'mockNotes';
const PAGES_KEY = 'mockNotePages';
const DELAY_MS = 300;

const SEED_NOTES: NoteDetail[] = [
  {
    id: 1,
    topicId: 1,
    title: 'Derechos fundamentales',
    kind: 'text',
    updatedAt: '2026-10-28',
    content:
      '<h2>Derechos fundamentales</h2><p>Están en la Sección 1.ª del Capítulo II del Título I (artículos 15 a 29).</p><ul><li>Tienen la máxima protección: recurso de amparo.</li><li>Se desarrollan por ley orgánica.</li></ul>',
    fileUrl: null,
  },
];

const today = (): string => formatISO(new Date(), { representation: 'date' });

const PREVIEW_LENGTH = 220;

const textPreview = (html: string | null): string =>
  (
    new DOMParser().parseFromString((html ?? '').replace(/<\/(h\d|p|li)>/g, '$& '), 'text/html')
      .body.textContent ?? ''
  ).slice(0, PREVIEW_LENGTH);

const toSummary = ({ id, title, kind, updatedAt, content, fileUrl }: NoteDetail): TopicNote => ({
  id,
  title,
  kind,
  updatedAt,
  preview: kind === 'text' ? textPreview(content) : fileUrl,
});

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

@Injectable({ providedIn: 'root' })
export class NotesService {
  #notes: NoteDetail[] = readJson<NoteDetail[]>(STORAGE_KEY) ?? SEED_NOTES;
  #nextId = Math.max(0, ...this.#notes.map(({ id }) => id)) + 1;

  getTopicNotes(topicId: number): Observable<TopicNote[]> {
    return of(this.#notes.filter((note) => note.topicId === topicId).map(toSummary));
  }

  countByTopic(): Record<number, number> {
    return this.#notes.reduce<Record<number, number>>(
      (counts, { topicId }) => ({ ...counts, [topicId]: (counts[topicId] ?? 0) + 1 }),
      {},
    );
  }

  getNote(noteId: number): Observable<NoteDetail> {
    const note = this.#notes.find(({ id }) => id === noteId);
    return note ? of(note).pipe(delay(DELAY_MS)) : throwError(() => new Error('Note not found'));
  }

  saveTextNote(
    topicId: number,
    noteId: number | null,
    { title, content }: NoteDraft,
  ): Observable<NoteDetail> {
    const note: NoteDetail = {
      id: noteId ?? this.#nextId++,
      topicId,
      title,
      kind: 'text',
      updatedAt: today(),
      content,
      fileUrl: null,
    };
    this.#notes = noteId
      ? this.#notes.map((current) => (current.id === noteId ? note : current))
      : [...this.#notes, note];
    this.#save();
    return of(note).pipe(delay(DELAY_MS));
  }

  uploadFile(topicId: number, file: File): Observable<TopicNote> {
    return from(readAsDataUrl(file)).pipe(
      map((fileUrl) => {
        const note: NoteDetail = {
          id: this.#nextId++,
          topicId,
          title: file.name.replace(/\.[^.]+$/, ''),
          kind: file.type.startsWith('image/') ? 'image' : 'pdf',
          updatedAt: today(),
          content: null,
          fileUrl,
        };
        this.#notes = [...this.#notes, note];
        this.#save();
        return toSummary(note);
      }),
      delay(DELAY_MS),
    );
  }

  deleteNote(noteId: number): Observable<number> {
    this.#notes = this.#notes.filter(({ id }) => id !== noteId);
    this.#save();
    return of(noteId).pipe(delay(DELAY_MS));
  }

  getLastPage(noteId: number): number {
    return readJson<Record<number, number>>(PAGES_KEY)?.[noteId] ?? 1;
  }

  setLastPage(noteId: number, page: number): void {
    writeJson(PAGES_KEY, { ...readJson<Record<number, number>>(PAGES_KEY), [noteId]: page });
  }

  #save(): void {
    writeJson(STORAGE_KEY, this.#notes);
  }
}
