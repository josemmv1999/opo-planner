import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import { syllabusOppositionOf } from './syllabus-opposition.ts';

interface BlockRow {
  id: number;
  label: string;
  name: string;
}

interface TopicRow {
  id: number;
  block_id: number;
  number: number;
  name: string;
  description: string;
}

export const syllabusRoutes = (database: DatabaseSync): Router => {
  const oppositionOf = syllabusOppositionOf(database);
  const listBlocks = database.prepare(
    'SELECT id, label, name FROM syllabus_blocks WHERE opposition_id = ? ORDER BY id',
  );
  const listTopics = database.prepare(
    `SELECT topics.id, opposition_topics.block_id, opposition_topics.number, topics.name, topics.description
      FROM opposition_topics JOIN topics ON topics.id = opposition_topics.topic_id
      WHERE opposition_topics.opposition_id = ?
      ORDER BY opposition_topics.block_id, opposition_topics.number`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res: AuthenticatedResponse) => {
      const oppositionId = oppositionOf(res.locals.user.id);
      const topics = listTopics.all(oppositionId) as unknown as TopicRow[];
      const blocks = (listBlocks.all(oppositionId) as unknown as BlockRow[]).map(
        ({ id, label, name }) => ({
          id,
          label,
          name,
          topics: topics
            .filter(({ block_id }) => block_id === id)
            .map(({ id, number, name, description }) => ({ id, number, name, description })),
        }),
      );
      res.json(blocks);
    });
};
