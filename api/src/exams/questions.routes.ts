import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser } from '../auth/require-user.ts';
import type { QuestionRow } from './question.ts';

const MAX_COUNT = 100;

export const questionsRoutes = (database: DatabaseSync): Router => {
  const randomTopicQuestions = database.prepare(
    `SELECT * FROM questions
      WHERE is_reserve = 0 AND is_voided = 0 AND correct_option IS NOT NULL AND case_text IS NULL
        AND topic_id IN (SELECT value FROM json_each(?))
      ORDER BY RANDOM() LIMIT ?`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (req, res) => {
      const topicIds = String(req.query['topicIds'] ?? '')
        .split(',')
        .map(Number)
        .filter((topicId) => Number.isInteger(topicId) && topicId > 0);
      const count = Math.min(Number(req.query['count']) || 0, MAX_COUNT);
      if (!topicIds.length || count < 1) return void res.sendStatus(400);
      const rows = randomTopicQuestions.all(
        JSON.stringify(topicIds),
        count,
      ) as unknown as QuestionRow[];
      res.json(
        rows.map((row) => ({
          id: row.id,
          topicId: row.topic_id,
          caseText: row.case_text,
          statement: row.statement,
          options: JSON.parse(row.options) as string[],
          correctOption: row.correct_option,
          block: row.section,
        })),
      );
    });
};
