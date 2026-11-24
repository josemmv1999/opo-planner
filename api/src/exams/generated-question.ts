export interface GeneratedQuestion {
  topic: string;
  statement: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  source?: string;
}

export type GeneratedQuestionError = 'format' | 'topic' | 'duplicate';

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

export const isGeneratedQuestion = (value: unknown): value is GeneratedQuestion => {
  const question = value as GeneratedQuestion;
  return (
    isText(question?.topic) &&
    isText(question.statement) &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every(isText) &&
    Number.isInteger(question.correctOption) &&
    question.correctOption >= 0 &&
    question.correctOption <= 3 &&
    (question.explanation === undefined || typeof question.explanation === 'string') &&
    (question.source === undefined || typeof question.source === 'string')
  );
};

export const parseTopic = (topic: string): { blockLabel: string; number: number } | null => {
  const match = /^\s*(I|II|III|IV|V|VI)\s*\.\s*(\d+)\s*$/i.exec(topic);
  return match
    ? { blockLabel: `Bloque ${match[1].toUpperCase()}`, number: Number(match[2]) }
    : null;
};
