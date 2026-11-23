import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';

interface TopicResultRow {
  id: number;
  topic_id: number;
  date: string;
  percentage: number;
  mistakes: string;
  correct_question_ids: string;
  is_review: number;
}

const toTopicResult = (row: TopicResultRow) => ({
  id: row.id,
  topicId: row.topic_id,
  date: row.date,
  percentage: row.percentage,
  mistakes: JSON.parse(row.mistakes) as unknown[],
  correctQuestionIds: JSON.parse(row.correct_question_ids) as number[],
  isReview: !!row.is_review,
});

export const topicResultsRoutes = (database: DatabaseSync): Router => {
  const listResults = database.prepare(
    'SELECT * FROM topic_results WHERE user_id = ? AND (? IS NULL OR topic_id = ?) ORDER BY id',
  );
  const insertResult = database.prepare(
    `INSERT INTO topic_results
      (user_id, topic_id, date, percentage, mistakes, correct_question_ids, is_review)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (req, res: AuthenticatedResponse) => {
      const topicId = req.query['topicId'] ? Number(req.query['topicId']) : null;
      const rows = listResults.all(
        res.locals.user.id,
        topicId,
        topicId,
      ) as unknown as TopicResultRow[];
      res.json(rows.map(toTopicResult));
    })
    .post('/', (req, res: AuthenticatedResponse) => {
      const { topicId, date, percentage, mistakes, correctQuestionIds, isReview } = req.body ?? {};
      const isValid =
        Number.isInteger(topicId) &&
        typeof date === 'string' &&
        Number.isInteger(percentage) &&
        Array.isArray(mistakes) &&
        Array.isArray(correctQuestionIds) &&
        typeof isReview === 'boolean';
      if (!isValid) return void res.sendStatus(400);
      try {
        const row = insertResult.get(
          res.locals.user.id,
          topicId,
          date,
          percentage,
          JSON.stringify(mistakes),
          JSON.stringify(correctQuestionIds),
          isReview ? 1 : 0,
        ) as unknown as TopicResultRow;
        res.status(201).json(toTopicResult(row));
      } catch {
        res.sendStatus(400);
      }
    });
};
