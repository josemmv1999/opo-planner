export interface SyllabusTopic {
  id: number;
  number: number;
  name: string;
  correctPercentage: number | null;
  notesCount: number;
  isStudied: boolean;
}

export interface SyllabusBlock {
  id: number;
  label: string;
  name: string;
  correctPercentage: number | null;
  isStudied: boolean;
  topics: SyllabusTopic[];
}

export type SyllabusFilter = 'all' | 'pending' | 'studied';

export interface TopicLaw {
  name: string;
  scope: string;
  boeId: string;
}

export type NoteKind = 'pdf' | 'image' | 'text';

export interface TopicNote {
  id: number;
  title: string;
  kind: NoteKind;
  updatedAt: string;
  preview: string | null;
}

export interface NoteDetail extends Omit<TopicNote, 'preview'> {
  topicId: number;
  content: string | null;
  fileUrl: string | null;
}

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfHighlightDraft {
  page: number;
  text: string;
  rects: HighlightRect[];
}

export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export type HighlightStyle = 'highlight' | 'underline';

export interface HighlightMark {
  color: HighlightColor;
  style: HighlightStyle;
}

export interface PdfHighlight extends PdfHighlightDraft, HighlightMark {
  id: number;
  note: string;
}

export interface HighlightChange {
  note: string;
  color: HighlightColor;
}

export type HighlightUpdate = { id: number } & Partial<HighlightChange & HighlightMark>;

export type MarginSide = 'left' | 'right';

export interface MarginNoteDraft {
  page: number;
  y: number;
  side: MarginSide;
}

export interface MarginNoteChange {
  text: string;
  color: HighlightColor;
}

export interface MarginNote extends MarginNoteDraft, MarginNoteChange {
  id: number;
}

export interface MarginNoteMove {
  id: number;
  y: number;
  side: MarginSide;
}

export interface NoteAnnotations {
  highlights: PdfHighlight[];
  marginNotes: MarginNote[];
}

export interface NoteDraft {
  title: string;
  content: string;
}

export interface TopicLink {
  id: number;
  number: number;
  name: string;
}

export interface ReviewQuestion {
  questionId: number;
  statement: string;
  options: string[];
  chosenOption: number;
  correctOption: number;
  reasoning: string;
}

export interface TopicResult {
  id: number;
  topicId: number;
  date: string;
  percentage: number;
  mistakes: ReviewQuestion[];
  correctQuestionIds: number[];
  isReview: boolean;
}

export interface SyllabusTopicDetail {
  id: number;
  number: number;
  name: string;
  blockLabel: string;
  blockName: string;
  correctPercentage: number | null;
  laws: TopicLaw[];
  notes: TopicNote[];
  previousTopic: TopicLink | null;
  nextTopic: TopicLink | null;
}
