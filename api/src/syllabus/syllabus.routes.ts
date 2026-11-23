import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser } from '../auth/require-user.ts';

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
  const listBlocks = database.prepare('SELECT * FROM syllabus_blocks ORDER BY id');
  const listTopics = database.prepare('SELECT * FROM topics ORDER BY block_id, number');

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res) => {
      const topics = listTopics.all() as unknown as TopicRow[];
      const blocks = (listBlocks.all() as unknown as BlockRow[]).map(({ id, label, name }) => ({
        id,
        label,
        name,
        topics: topics
          .filter(({ block_id }) => block_id === id)
          .map(({ id, number, name, description }) => ({ id, number, name, description })),
      }));
      res.json(blocks);
    });
};
