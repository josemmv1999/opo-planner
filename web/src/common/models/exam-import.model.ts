export interface ParsedQuestion {
  section: string;
  number: number;
  isReserve: boolean;
  caseText: string | null;
  statement: string;
  options: string[];
  correctOption: number | null;
  isVoided: boolean;
}

export type ImportErrorKind = 'missingAnswer' | 'optionCount' | 'missingQuestion';

export interface ImportError {
  kind: ImportErrorKind;
  section: string;
  number: number;
  isReserve: boolean;
}

export interface ParsedExam {
  questions: ParsedQuestion[];
  errors: ImportError[];
}

export interface ExamImportFiles {
  questionnaire: File;
  answerKey: File;
}

export interface ImportedExam {
  id: number;
  name: string;
  importedAt: string;
  questions: ParsedQuestion[];
}
