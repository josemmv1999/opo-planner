import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  HighlightChange,
  HighlightColor,
  NoteDetail,
  NoteDraft,
  PdfHighlight,
  PdfHighlightDraft,
  TopicNote,
} from '../../common/models/syllabus.model';
import { removeStorage } from '../../common/utils/storage';
import { readJson, writeJson } from './mock-storage';

const PAGES_KEY = 'notePages';
const URL = '/api/notes';
const OLD_KEYS = ['mockNotes', 'mockPdfHighlights', 'mockNotePages'];

interface ApiHighlight extends PdfHighlightDraft {
  id: number;
  kind: 'highlight';
  comment: string;
  color: HighlightColor;
}

const toHighlight = ({ id, page, text, rects, comment, color }: ApiHighlight): PdfHighlight => ({
  id,
  page,
  text,
  rects,
  note: comment,
  color,
});

@Injectable({ providedIn: 'root' })
export class NotesService {
  readonly #http = inject(HttpClient);

  constructor() {
    OLD_KEYS.forEach(removeStorage);
  }

  getTopicNotes(topicId: number): Observable<TopicNote[]> {
    return this.#http.get<TopicNote[]>(URL, { params: { topicId } });
  }

  countByTopic(): Observable<Record<number, number>> {
    return this.#http.get<Record<number, number>>(`${URL}/counts`);
  }

  getNote(noteId: number): Observable<NoteDetail> {
    return this.#http.get<NoteDetail>(`${URL}/${noteId}`);
  }

  saveTextNote(
    topicId: number,
    noteId: number | null,
    { title, content }: NoteDraft,
  ): Observable<NoteDetail> {
    return noteId === null
      ? this.#http.post<NoteDetail>(URL, { topicId, title, content })
      : this.#http.put<NoteDetail>(`${URL}/${noteId}`, { title, content });
  }

  uploadFile(topicId: number, file: File): Observable<TopicNote> {
    return this.#http.post<TopicNote>(`${URL}/file`, file, {
      params: { topicId, name: file.name },
      headers: { 'Content-Type': file.type },
    });
  }

  deleteNote(noteId: number): Observable<number> {
    return this.#http.delete<void>(`${URL}/${noteId}`).pipe(map(() => noteId));
  }

  getLastPage(noteId: number): number {
    return readJson<Record<number, number>>(PAGES_KEY)?.[noteId] ?? 1;
  }

  setLastPage(noteId: number, page: number): void {
    writeJson(PAGES_KEY, { ...readJson<Record<number, number>>(PAGES_KEY), [noteId]: page });
  }

  getHighlights(noteId: number): Observable<PdfHighlight[]> {
    return this.#http
      .get<(ApiHighlight | { kind: 'margin' })[]>(`${URL}/${noteId}/annotations`)
      .pipe(
        map((annotations) =>
          annotations
            .filter((annotation): annotation is ApiHighlight => annotation.kind === 'highlight')
            .map(toHighlight),
        ),
      );
  }

  addHighlight(
    noteId: number,
    draft: PdfHighlightDraft,
    color: HighlightColor,
  ): Observable<PdfHighlight> {
    return this.#http
      .post<ApiHighlight>(`${URL}/${noteId}/annotations`, { ...draft, kind: 'highlight', color })
      .pipe(map(toHighlight));
  }

  updateHighlight(
    noteId: number,
    highlightId: number,
    { note, color }: HighlightChange,
  ): Observable<PdfHighlight> {
    return this.#http
      .put<ApiHighlight>(`${URL}/${noteId}/annotations/${highlightId}`, { comment: note, color })
      .pipe(map(toHighlight));
  }

  deleteHighlight(noteId: number, highlightId: number): Observable<number> {
    return this.#http
      .delete<void>(`${URL}/${noteId}/annotations/${highlightId}`)
      .pipe(map(() => highlightId));
  }
}
