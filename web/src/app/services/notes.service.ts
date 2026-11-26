import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  HighlightMark,
  HighlightStyle,
  HighlightUpdate,
  HighlightColor,
  InkStroke,
  InkStrokeDraft,
  MarginNote,
  MarginNoteChange,
  MarginNoteDraft,
  MarginNoteMove,
  NoteAnnotations,
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

interface ApiMarginNote extends MarginNoteDraft {
  id: number;
  kind: 'margin';
  comment: string;
  color: HighlightColor;
}

const toMarginNote = ({ id, page, y, side, comment, color }: ApiMarginNote): MarginNote => ({
  id,
  page,
  y,
  side,
  text: comment,
  color,
});

interface ApiHighlight extends PdfHighlightDraft {
  id: number;
  kind: HighlightStyle;
  comment: string;
  color: HighlightColor;
}

const toHighlight = ({
  id,
  page,
  text,
  rects,
  comment,
  color,
  kind,
}: ApiHighlight): PdfHighlight => ({
  id,
  page,
  text,
  rects,
  note: comment,
  color,
  style: kind,
});

interface ApiInkStroke extends InkStroke {
  kind: 'ink';
}

const toInkStroke = ({ id, page, points, color, width }: ApiInkStroke): InkStroke => ({
  id,
  page,
  points,
  color,
  width,
});

type ApiAnnotation = ApiHighlight | ApiMarginNote | ApiInkStroke;

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

  getAnnotations(annotationsUrl: string): Observable<NoteAnnotations> {
    return this.#http.get<ApiAnnotation[]>(annotationsUrl).pipe(
      map((annotations) => ({
        highlights: annotations
          .filter(
            (annotation): annotation is ApiHighlight =>
              annotation.kind === 'highlight' || annotation.kind === 'underline',
          )
          .map(toHighlight),
        marginNotes: annotations
          .filter((annotation): annotation is ApiMarginNote => annotation.kind === 'margin')
          .map(toMarginNote),
        inkStrokes: annotations
          .filter((annotation): annotation is ApiInkStroke => annotation.kind === 'ink')
          .map(toInkStroke),
      })),
    );
  }

  addInkStroke(annotationsUrl: string, draft: InkStrokeDraft): Observable<InkStroke> {
    return this.#http
      .post<ApiInkStroke>(annotationsUrl, { ...draft, kind: 'ink' })
      .pipe(map(toInkStroke));
  }

  addMarginNote(
    annotationsUrl: string,
    draft: MarginNoteDraft,
    { text, color }: MarginNoteChange,
  ): Observable<MarginNote> {
    return this.#http
      .post<ApiMarginNote>(annotationsUrl, {
        ...draft,
        kind: 'margin',
        color,
        comment: text,
      })
      .pipe(map(toMarginNote));
  }

  updateMarginNote(
    annotationsUrl: string,
    marginNoteId: number,
    { text, color }: MarginNoteChange,
  ): Observable<MarginNote> {
    return this.#http
      .put<ApiMarginNote>(`${annotationsUrl}/${marginNoteId}`, { comment: text, color })
      .pipe(map(toMarginNote));
  }

  moveMarginNote(annotationsUrl: string, { id, y, side }: MarginNoteMove): Observable<MarginNote> {
    return this.#http
      .put<ApiMarginNote>(`${annotationsUrl}/${id}`, { y, side })
      .pipe(map(toMarginNote));
  }

  addHighlight(
    annotationsUrl: string,
    draft: PdfHighlightDraft,
    { color, style }: HighlightMark,
  ): Observable<PdfHighlight> {
    return this.#http
      .post<ApiHighlight>(annotationsUrl, { ...draft, kind: style, color })
      .pipe(map(toHighlight));
  }

  updateHighlight(
    annotationsUrl: string,
    { id, note, color, style }: HighlightUpdate,
  ): Observable<PdfHighlight> {
    return this.#http
      .put<ApiHighlight>(`${annotationsUrl}/${id}`, {
        comment: note,
        color,
        kind: style,
      })
      .pipe(map(toHighlight));
  }

  deleteAnnotation(annotationsUrl: string, annotationId: number): Observable<number> {
    return this.#http
      .delete<void>(`${annotationsUrl}/${annotationId}`)
      .pipe(map(() => annotationId));
  }
}
