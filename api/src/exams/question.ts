export interface ParsedQuestion {
  section: string;
  number: number;
  isReserve: boolean;
  caseText: string | null;
  statement: string;
  options: string[];
  correctOption: number | null;
  isVoided: boolean;
  topicId: number | null;
}

export interface QuestionRow {
  id: number;
  exam_id: number | null;
  topic_id: number | null;
  section: string;
  number: number;
  is_reserve: number;
  case_text: string | null;
  statement: string;
  options: string;
  correct_option: number | null;
  is_voided: number;
}

export const toParsedQuestion = (row: QuestionRow): ParsedQuestion => ({
  section: row.section,
  number: row.number,
  isReserve: !!row.is_reserve,
  caseText: row.case_text,
  statement: row.statement,
  options: JSON.parse(row.options) as string[],
  correctOption: row.correct_option,
  isVoided: !!row.is_voided,
  topicId: row.topic_id,
});

export const isParsedQuestion = (value: unknown): value is ParsedQuestion => {
  const question = value as ParsedQuestion;
  return (
    typeof question?.section === 'string' &&
    Number.isInteger(question.number) &&
    typeof question.statement === 'string' &&
    (question.topicId == null || Number.isInteger(question.topicId)) &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === 'string')
  );
};
