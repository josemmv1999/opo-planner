import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { syllabusOppositionOf } from '../syllabus/syllabus-opposition.ts';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import type { QuestionRow } from './question.ts';
import { shuffleOptions } from './shuffle-options.ts';

const MIXED_EXAM = {
  id: 'mixed',
  name: 'Batiburrillo',
  minutes: 60,
  questionCount: 60,
};
const USABLE = 'is_reserve = 0 AND is_voided = 0 AND correct_option IS NOT NULL';

const toExamQuestion = ({ id, statement, options, correct_option, section }: QuestionRow) => ({
  id,
  statement,
  ...shuffleOptions(JSON.parse(options) as string[], correct_option),
  block: section,
});

interface ExamCase {
  section: string;
  text: string;
  questions: ReturnType<typeof toExamQuestion>[];
}

const toCases = (rows: QuestionRow[]): ExamCase[] => [
  ...rows
    .reduce((cases, row) => {
      const examCase = cases.get(row.section) ?? {
        section: row.section,
        text: row.case_text ?? '',
        questions: [],
      };
      examCase.questions.push(toExamQuestion(row));
      return cases.set(row.section, examCase);
    }, new Map<string, ExamCase>())
    .values(),
];

export const examsRoutes = (database: DatabaseSync): Router => {
  const oppositionOf = syllabusOppositionOf(database);
  const listExams = database.prepare(
    `SELECT exams.id, exams.name, exams.minutes, COUNT(questions.id) AS questionCount,
      (SELECT percentage FROM exam_attempts
        WHERE user_id = ? AND exam_attempts.opposition_id = exams.opposition_id
          AND exam_attempts.name = exams.name
        ORDER BY id DESC LIMIT 1) AS lastPercentage
      FROM exams JOIN questions ON questions.exam_id = exams.id AND ${USABLE}
      WHERE exams.opposition_id = ?
      GROUP BY exams.id ORDER BY exams.id DESC`,
  );
  const findExam = database.prepare('SELECT id, name, minutes FROM exams WHERE id = ?');
  const listQuestions = database.prepare(
    `SELECT * FROM questions WHERE exam_id = ? AND ${USABLE} ORDER BY id`,
  );
  const randomQuestions = database.prepare(
    `SELECT * FROM questions WHERE ${USABLE} AND case_text IS NULL
      AND (exam_id IN (SELECT id FROM exams WHERE opposition_id = ?)
        OR (exam_id IS NULL AND topic_id IN (SELECT topic_id FROM opposition_topics WHERE opposition_id = ?)))
      ORDER BY RANDOM() LIMIT ?`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res: AuthenticatedResponse) => {
      res.json(listExams.all(res.locals.user.id, oppositionOf(res.locals.user.id)));
    })
    .get('/mixed', (_req, res: AuthenticatedResponse) => {
      const { id, name, minutes, questionCount } = MIXED_EXAM;
      const oppositionId = oppositionOf(res.locals.user.id);
      const questions = randomQuestions.all(
        oppositionId,
        oppositionId,
        questionCount,
      ) as unknown as QuestionRow[];
      res.json({ id, name, minutes, questions: questions.map(toExamQuestion) });
    })
    .get('/:id', (req, res) => {
      const exam = findExam.get(Number(req.params.id)) as
        { id: number; name: string; minutes: number } | undefined;
      if (!exam) return void res.sendStatus(404);
      const rows = listQuestions.all(exam.id) as unknown as QuestionRow[];
      res.json({
        ...exam,
        id: String(exam.id),
        questions: rows.filter((row) => !row.case_text).map(toExamQuestion),
        cases: toCases(rows.filter((row) => row.case_text)),
      });
    });
};
