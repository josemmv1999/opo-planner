import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import type { QuestionRow } from './question.ts';

const MIXED_EXAM = { id: 'mixed', name: 'Batiburrillo', minutes: 60, questionCount: 60 };
const USABLE = 'is_reserve = 0 AND is_voided = 0 AND correct_option IS NOT NULL';

const toExamQuestion = ({ id, statement, options, correct_option, section }: QuestionRow) => ({
  id,
  statement,
  options: JSON.parse(options) as string[],
  correctOption: correct_option,
  block: section,
});

export const examsRoutes = (database: DatabaseSync): Router => {
  const listExams = database.prepare(
    `SELECT exams.id, exams.name, exams.minutes, COUNT(questions.id) AS questionCount,
      (SELECT percentage FROM exam_attempts
        WHERE user_id = ? AND exam_attempts.name = exams.name
        ORDER BY id DESC LIMIT 1) AS lastPercentage
      FROM exams JOIN questions ON questions.exam_id = exams.id AND ${USABLE}
      GROUP BY exams.id ORDER BY exams.id DESC`,
  );
  const findExam = database.prepare('SELECT id, name, minutes FROM exams WHERE id = ?');
  const listQuestions = database.prepare(
    `SELECT * FROM questions WHERE exam_id = ? AND ${USABLE} ORDER BY id`,
  );
  const randomQuestions = database.prepare(
    `SELECT * FROM questions WHERE ${USABLE} ORDER BY RANDOM() LIMIT ?`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res: AuthenticatedResponse) => {
      res.json(listExams.all(res.locals.user.id));
    })
    .get('/mixed', (_req, res) => {
      const { id, name, minutes, questionCount } = MIXED_EXAM;
      const questions = randomQuestions.all(questionCount) as unknown as QuestionRow[];
      res.json({ id, name, minutes, questions: questions.map(toExamQuestion) });
    })
    .get('/:id', (req, res) => {
      const exam = findExam.get(Number(req.params.id)) as
        { id: number; name: string; minutes: number } | undefined;
      if (!exam) return void res.sendStatus(404);
      const questions = listQuestions.all(exam.id) as unknown as QuestionRow[];
      res.json({ ...exam, id: String(exam.id), questions: questions.map(toExamQuestion) });
    });
};
