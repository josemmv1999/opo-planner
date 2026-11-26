import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser } from '../auth/require-user.ts';
import { toMaterial, type MaterialRow } from './material.ts';

export const materialsRoutes = (database: DatabaseSync, uploadsDir: string): Router => {
  const listMaterials = database.prepare(
    'SELECT * FROM topic_materials WHERE topic_id = ? ORDER BY id',
  );
  const findMaterial = database.prepare('SELECT * FROM topic_materials WHERE id = ?');

  const find = (id: unknown) => findMaterial.get(Number(id)) as MaterialRow | undefined;

  return Router()
    .use(requireUser(database))
    .get('/', (req, res) => {
      const rows = listMaterials.all(Number(req.query['topicId'])) as unknown as MaterialRow[];
      res.json(rows.map(toMaterial));
    })
    .get('/:id', (req, res) => {
      const row = find(req.params['id']);
      if (!row) return void res.sendStatus(404);
      res.json(toMaterial(row));
    })
    .get('/:id/file', (req, res) => {
      const row = find(req.params['id']);
      if (!row) return void res.sendStatus(404);
      res.type(row.mime_type);
      res.sendFile(join(uploadsDir, row.file_name));
    });
};
