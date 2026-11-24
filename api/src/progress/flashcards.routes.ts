import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import type { QuestionRow } from '../exams/question.ts';

const DEFAULT_COUNT = 15;
const MAX_COUNT = 50;
const USABLE = `is_reserve = 0 AND is_voided = 0 AND correct_option IS NOT NULL
  AND case_text IS NULL AND review_status = 'approved'`;

const toFlashcard = (row: QuestionRow, random: () => number) => {
  const options = JSON.parse(row.options) as string[];
  const correct = row.correct_option ?? 0;
  const wrong = options.map((_, index) => index).filter((index) => index !== correct);
  const isTrue = random() < 0.5;
  const shown = isTrue ? correct : wrong[Math.floor(random() * wrong.length)];
  const statement = row.statement.trim();
  const reason = [row.source, row.explanation].filter(Boolean).join(': ');
  return {
    id: row.id,
    text: `${statement} → ${options[shown]}`,
    isTrue,
    explanation: `Respuesta correcta: ${options[correct]}${reason ? ` (${reason})` : ''}`,
  };
};

export const flashcardsRoutes = (
  database: DatabaseSync,
  random: () => number = Math.random,
): Router => {
  const unseenQuestions = database.prepare(
    `SELECT * FROM questions WHERE ${USABLE}
      AND id NOT IN (SELECT question_id FROM flashcard_views WHERE user_id = ?)
      ORDER BY RANDOM() LIMIT ?`,
  );
  const markSeen = database.prepare(
    'INSERT OR IGNORE INTO flashcard_views (user_id, question_id) VALUES (?, ?)',
  );
  const forgetSeen = database.prepare('DELETE FROM flashcard_views WHERE user_id = ?');

  return Router()
    .use(requireUser(database))
    .get('/', (req, res: AuthenticatedResponse) => {
      const userId = res.locals.user.id;
      const count = Math.min(Number(req.query['count']) || DEFAULT_COUNT, MAX_COUNT);
      let rows = unseenQuestions.all(userId, count) as unknown as QuestionRow[];
      if (rows.length < count) {
        forgetSeen.run(userId);
        const servedIds = new Set(rows.map(({ id }) => id));
        const more = (unseenQuestions.all(userId, count) as unknown as QuestionRow[]).filter(
          ({ id }) => !servedIds.has(id),
        );
        rows = [...rows, ...more].slice(0, count);
      }
      rows.forEach(({ id }) => markSeen.run(userId, id));
      res.json(rows.map((row) => toFlashcard(row, random)));
    });
};
