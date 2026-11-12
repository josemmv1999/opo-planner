export interface SyllabusTopic {
  id: number;
  number: number;
  name: string;
  correctPercentage: number | null;
  notesCount: number;
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
