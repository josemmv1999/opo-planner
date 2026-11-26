import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import express, { Router } from 'express';
import { requireAdmin } from '../auth/require-admin.ts';
import { requireUser } from '../auth/require-user.ts';
import { toMaterial, type MaterialRow } from './material.ts';

const MAX_FILE_SIZE = '100mb';
const PDF = 'application/pdf';

export const adminMaterialsRoutes = (database: DatabaseSync, uploadsDir: string): Router => {
  mkdirSync(uploadsDir, { recursive: true });
  const insertMaterial = database.prepare(
    `INSERT INTO topic_materials (topic_id, title, file_name, mime_type, uploaded_at)
      VALUES (?, ?, ?, ?, ?) RETURNING *`,
  );
  const findMaterial = database.prepare('SELECT * FROM topic_materials WHERE id = ?');
  const deleteMaterial = database.prepare('DELETE FROM topic_materials WHERE id = ?');

  return Router()
    .use(requireUser(database), requireAdmin)
    .post('/file', express.raw({ type: () => true, limit: MAX_FILE_SIZE }), async (req, res) => {
      const topicId = Number(req.query['topicId']);
      const name = String(req.query['name'] ?? '');
      if (
        !Number.isInteger(topicId) ||
        !name ||
        req.get('Content-Type') !== PDF ||
        !Buffer.isBuffer(req.body)
      )
        return void res.sendStatus(400);
      const fileName = randomUUID();
      await writeFile(join(uploadsDir, fileName), req.body);
      try {
        const row = insertMaterial.get(
          topicId,
          name.replace(/\.[^.]+$/, ''),
          fileName,
          PDF,
          new Date().toISOString().slice(0, 10),
        ) as unknown as MaterialRow;
        res.status(201).json(toMaterial(row));
      } catch {
        await rm(join(uploadsDir, fileName), { force: true });
        res.sendStatus(400);
      }
    })
    .delete('/:id', async (req, res) => {
      const row = findMaterial.get(Number(req.params['id'])) as MaterialRow | undefined;
      if (!row) return void res.sendStatus(404);
      deleteMaterial.run(row.id);
      await rm(join(uploadsDir, row.file_name), { force: true });
      res.sendStatus(204);
    });
};
