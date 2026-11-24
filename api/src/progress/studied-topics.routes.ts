import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';

export const studiedTopicsRoutes = (database: DatabaseSync): Router => {
  const listStudied = database.prepare(
    'SELECT topic_id FROM studied_topics WHERE user_id = ? ORDER BY topic_id',
  );
  const markStudied = database.prepare(
    'INSERT OR IGNORE INTO studied_topics (user_id, topic_id) VALUES (?, ?)',
  );
  const unmarkStudied = database.prepare(
    'DELETE FROM studied_topics WHERE user_id = ? AND topic_id = ?',
  );

  const studiedIds = (userId: number): number[] =>
    (listStudied.all(userId) as { topic_id: number }[]).map(({ topic_id }) => topic_id);

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res: AuthenticatedResponse) => {
      res.json(studiedIds(res.locals.user.id));
    })
    .put('/', (req, res: AuthenticatedResponse) => {
      const { topicIds, isStudied } = req.body ?? {};
      const isValid =
        Array.isArray(topicIds) &&
        topicIds.length > 0 &&
        topicIds.every(Number.isInteger) &&
        typeof isStudied === 'boolean';
      if (!isValid) return void res.sendStatus(400);
      const userId = res.locals.user.id;
      try {
        database.exec('BEGIN');
        for (const topicId of topicIds)
          (isStudied ? markStudied : unmarkStudied).run(userId, topicId);
        database.exec('COMMIT');
      } catch {
        database.exec('ROLLBACK');
        return void res.sendStatus(400);
      }
      res.json(studiedIds(userId));
    });
};
