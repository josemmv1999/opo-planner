import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import express, { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';

const PREVIEW_LENGTH = 220;
const MAX_FILE_SIZE = '100mb';

interface NoteRow {
  id: number;
  topic_id: number;
  title: string;
  kind: 'text' | 'pdf' | 'image';
  content: string | null;
  file_name: string | null;
  mime_type: string | null;
  updated_at: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

const fileUrl = (row: NoteRow): string | null =>
  row.file_name ? `/api/notes/${row.id}/file` : null;

const textPreview = (html: string | null): string =>
  (html ?? '')
    .replace(/<\/(h\d|p|li)>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PREVIEW_LENGTH);

const toSummary = (row: NoteRow) => ({
  id: row.id,
  title: row.title,
  kind: row.kind,
  updatedAt: row.updated_at,
  preview: row.kind === 'text' ? textPreview(row.content) : fileUrl(row),
});

const toDetail = (row: NoteRow) => ({
  id: row.id,
  topicId: row.topic_id,
  title: row.title,
  kind: row.kind,
  updatedAt: row.updated_at,
  content: row.content,
  fileUrl: fileUrl(row),
});

const kindOf = (mimeType: string): NoteRow['kind'] | null =>
  mimeType === 'application/pdf' ? 'pdf' : mimeType.startsWith('image/') ? 'image' : null;

interface TitleRow {
  topic_id: number;
  title: string;
}

const toTitleKey = ({ topic_id, title }: TitleRow) =>
  `${topic_id}:${title.replace(/\s+/g, ' ').trim().toLowerCase()}`;

export const notesRoutes = (database: DatabaseSync, uploadsDir: string): Router => {
  mkdirSync(uploadsDir, { recursive: true });
  const listNotes = database.prepare(
    'SELECT * FROM notes WHERE user_id = ? AND topic_id = ? ORDER BY id',
  );
  const listNoteTitles = database.prepare(
    'SELECT topic_id, title, kind FROM notes WHERE user_id = ?',
  );
  const listMaterialTitles = database.prepare('SELECT topic_id, title FROM topic_materials');
  const findNote = database.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
  const insertNote = database.prepare(
    `INSERT INTO notes (user_id, topic_id, title, kind, content, file_name, mime_type, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  );
  const updateText = database.prepare(
    `UPDATE notes SET title = ?, content = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND kind = 'text' RETURNING *`,
  );
  const deleteNote = database.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');

  const countNotes = (userId: number) => {
    const own = listNoteTitles.all(userId) as unknown as (TitleRow & { kind: string })[];
    const ownPdfs = new Set(own.filter(({ kind }) => kind === 'pdf').map(toTitleKey));
    const shared = (listMaterialTitles.all() as unknown as TitleRow[]).filter(
      (material) => !ownPdfs.has(toTitleKey(material)),
    );
    const counts: Record<number, number> = {};
    for (const { topic_id } of [...own, ...shared]) counts[topic_id] = (counts[topic_id] ?? 0) + 1;
    return counts;
  };

  const find = (id: unknown, userId: number) =>
    findNote.get(Number(id), userId) as NoteRow | undefined;

  return Router()
    .use(requireUser(database))
    .get('/', (req, res: AuthenticatedResponse) => {
      const rows = listNotes.all(
        res.locals.user.id,
        Number(req.query['topicId']),
      ) as unknown as NoteRow[];
      res.json(rows.map(toSummary));
    })
    .get('/counts', (_req, res: AuthenticatedResponse) => {
      res.json(countNotes(res.locals.user.id));
    })
    .get('/:id', (req, res: AuthenticatedResponse) => {
      const row = find(req.params['id'], res.locals.user.id);
      if (!row) return void res.sendStatus(404);
      res.json(toDetail(row));
    })
    .get('/:id/file', (req, res: AuthenticatedResponse) => {
      const row = find(req.params['id'], res.locals.user.id);
      if (!row?.file_name) return void res.sendStatus(404);
      res.type(row.mime_type ?? 'application/octet-stream');
      res.sendFile(join(uploadsDir, row.file_name));
    })
    .post('/', (req, res: AuthenticatedResponse) => {
      const { topicId, title, content } = req.body ?? {};
      if (!Number.isInteger(topicId) || typeof title !== 'string' || typeof content !== 'string')
        return void res.sendStatus(400);
      try {
        const row = insertNote.get(
          res.locals.user.id,
          topicId,
          title,
          'text',
          content,
          null,
          null,
          today(),
        ) as unknown as NoteRow;
        res.status(201).json(toDetail(row));
      } catch {
        res.sendStatus(400);
      }
    })
    .put('/:id', (req, res: AuthenticatedResponse) => {
      const { title, content } = req.body ?? {};
      if (typeof title !== 'string' || typeof content !== 'string') return void res.sendStatus(400);
      const row = updateText.get(
        title,
        content,
        today(),
        Number(req.params['id']),
        res.locals.user.id,
      ) as NoteRow | undefined;
      if (!row) return void res.sendStatus(404);
      res.json(toDetail(row));
    })
    .post(
      '/file',
      express.raw({ type: () => true, limit: MAX_FILE_SIZE }),
      async (req, res: AuthenticatedResponse) => {
        const topicId = Number(req.query['topicId']);
        const name = String(req.query['name'] ?? '');
        const mimeType = req.get('Content-Type') ?? '';
        const kind = kindOf(mimeType);
        if (!Number.isInteger(topicId) || !name || !kind || !Buffer.isBuffer(req.body))
          return void res.sendStatus(400);
        const fileName = randomUUID();
        await writeFile(join(uploadsDir, fileName), req.body);
        try {
          const row = insertNote.get(
            res.locals.user.id,
            topicId,
            name.replace(/\.[^.]+$/, ''),
            kind,
            null,
            fileName,
            mimeType,
            today(),
          ) as unknown as NoteRow;
          res.status(201).json(toSummary(row));
        } catch {
          await rm(join(uploadsDir, fileName), { force: true });
          res.sendStatus(400);
        }
      },
    )
    .delete('/:id', async (req, res: AuthenticatedResponse) => {
      const row = find(req.params['id'], res.locals.user.id);
      if (!row) return void res.sendStatus(404);
      deleteNote.run(row.id, res.locals.user.id);
      if (row.file_name) await rm(join(uploadsDir, row.file_name), { force: true });
      res.sendStatus(204);
    });
};
