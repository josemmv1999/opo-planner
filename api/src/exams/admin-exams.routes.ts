import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { classifyQuestion } from '../syllabus/classify-question.ts';
import { requireAdmin } from '../auth/require-admin.ts';
import { requireUser } from '../auth/require-user.ts';
import {
  isParsedQuestion,
  toParsedQuestion,
  type ParsedQuestion,
  type QuestionRow,
} from './question.ts';

interface ExamRow {
  id: number;
  name: string;
  imported_at: string;
}

export const adminExamsRoutes = (database: DatabaseSync): Router => {
  const listExams = database.prepare('SELECT * FROM exams ORDER BY id DESC');
  const listQuestions = database.prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY id');
  const insertExam = database.prepare('INSERT INTO exams (name) VALUES (?) RETURNING *');
  const insertQuestion = database.prepare(
    `INSERT INTO questions
      (exam_id, section, number, is_reserve, case_text, statement, options, correct_option, is_voided, topic_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const deleteExam = database.prepare('DELETE FROM exams WHERE id = ?');

  const toImportedExam = ({ id, name, imported_at }: ExamRow) => ({
    id,
    name,
    importedAt: imported_at,
    questions: (listQuestions.all(id) as unknown as QuestionRow[]).map(toParsedQuestion),
  });

  const saveExam = (name: string, questions: ParsedQuestion[]): ExamRow => {
    database.exec('BEGIN');
    try {
      const exam = insertExam.get(name) as unknown as ExamRow;
      questions.forEach((question) =>
        insertQuestion.run(
          exam.id,
          question.section,
          question.number,
          question.isReserve ? 1 : 0,
          question.caseText,
          question.statement,
          JSON.stringify(question.options),
          question.correctOption,
          question.isVoided ? 1 : 0,
          question.topicId ?? null,
        ),
      );
      database.exec('COMMIT');
      return exam;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  };

  return Router()
    .use(requireUser(database), requireAdmin)
    .get('/', (_req, res) => {
      res.json((listExams.all() as unknown as ExamRow[]).map(toImportedExam));
    })
    .post('/classify', (req, res) => {
      const { questions } = req.body ?? {};
      if (!Array.isArray(questions)) return void res.sendStatus(400);
      res.json(
        questions.map(({ statement, options }: { statement?: unknown; options?: unknown }) =>
          typeof statement === 'string'
            ? classifyQuestion(statement, Array.isArray(options) ? options : [])
            : null,
        ),
      );
    })
    .post('/', (req, res) => {
      const { name, questions } = req.body ?? {};
      const isValid =
        typeof name === 'string' &&
        name.trim() !== '' &&
        Array.isArray(questions) &&
        questions.length > 0 &&
        questions.every(isParsedQuestion);
      if (!isValid) return void res.sendStatus(400);
      res.status(201).json(toImportedExam(saveExam(name.trim(), questions)));
    })
    .delete('/:id', (req, res) => {
      res.sendStatus(deleteExam.run(Number(req.params.id)).changes ? 204 : 404);
    });
};
