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

export interface TopicNote {
  id: number;
  title: string;
  kind: 'pdf' | 'text';
  updatedAt: string;
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
}
