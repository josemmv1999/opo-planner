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
