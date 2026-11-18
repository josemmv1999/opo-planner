import { ImportError, ParsedExam, ParsedQuestion } from '../models/exam-import.model';

type QuestionKey = Pick<ParsedQuestion, 'section' | 'number' | 'isReserve'>;

interface Answer extends QuestionKey {
  correctOption: number | null;
}

const SECTION = /^(primera parte|segunda parte|tercera parte|supuesto [ivx]+)$/i;
const RESERVE = /^preguntas de reserva$/i;
const PAGE_HEADER = /página \d+ de \d+$/i;
const CASE_INTRO = /^se plantean las siguientes cuestiones:?$/i;
const QUESTION = /^(\d+)\.\s+(.+)$/;
const OPTION = /^[a-d]\)\s*/;
const NEXT_OPTION = /\s+(?=[b-d]\)\s)/;
const ANSWER = /^(\d+)\.\s*([a-d]|anulada)$/i;

const toLines = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !PAGE_HEADER.test(line));

const keyOf = ({ section, isReserve, number }: QuestionKey): string =>
  `${section.toUpperCase()}|${isReserve}|${number}`;

const append = (text: string, line: string): string => (text ? `${text} ${line}` : line);

export const parseQuestionnaire = (text: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  let section = '';
  let isReserve = false;
  let caseText: string | null = null;
  let current: ParsedQuestion | null = null;

  for (const line of toLines(text)) {
    const [, number, statement] = line.match(QUESTION) ?? [];
    if (SECTION.test(line)) {
      section = line;
      isReserve = false;
      caseText = /^supuesto/i.test(line) ? '' : null;
      current = null;
    } else if (RESERVE.test(line)) {
      isReserve = true;
      current = null;
    } else if (CASE_INTRO.test(line)) {
      current = null;
    } else if (number && (!current || current.options.length)) {
      current = {
        section,
        number: Number(number),
        isReserve,
        caseText: caseText || null,
        statement,
        options: [],
        correctOption: null,
        isVoided: false,
      };
      questions.push(current);
    } else if (current && OPTION.test(line)) {
      current.options.push(...line.split(NEXT_OPTION).map((option) => option.replace(OPTION, '')));
    } else if (current?.options.length) {
      current.options.push(append(current.options.pop() ?? '', line));
    } else if (current) {
      current.statement = append(current.statement, line);
    } else if (caseText !== null) {
      caseText = append(caseText, line);
    }
  }
  return questions;
};

export const parseAnswerKey = (text: string): Answer[] => {
  const answers: Answer[] = [];
  let section = '';
  let isReserve = false;
  for (const line of toLines(text)) {
    const [, number, answer] = line.match(ANSWER) ?? [];
    if (SECTION.test(line)) {
      section = line;
      isReserve = false;
    } else if (RESERVE.test(line)) {
      isReserve = true;
    } else if (number) {
      const option = 'abcd'.indexOf(answer.toLowerCase());
      answers.push({
        section,
        number: Number(number),
        isReserve,
        correctOption: option === -1 ? null : option,
      });
    }
  }
  return answers;
};

export const parseOfficialExam = (questionnaire: string, answerKey: string): ParsedExam => {
  const answers = new Map(parseAnswerKey(answerKey).map((answer) => [keyOf(answer), answer]));
  const errors: ImportError[] = [];
  const questions = parseQuestionnaire(questionnaire).map((question) => {
    const { section, number, isReserve } = question;
    const answer = answers.get(keyOf(question));
    answers.delete(keyOf(question));
    if (!answer) errors.push({ kind: 'missingAnswer', section, number, isReserve });
    if (question.options.length !== 4)
      errors.push({ kind: 'optionCount', section, number, isReserve });
    return {
      ...question,
      correctOption: answer?.correctOption ?? null,
      isVoided: answer?.correctOption === null,
    };
  });
  for (const { section, number, isReserve } of answers.values())
    errors.push({ kind: 'missingQuestion', section, number, isReserve });
  return { questions, errors };
};
