import type { DatabaseSync } from 'node:sqlite';
import { Router, type Request } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import {
  parseAnnotationChange,
  parseNewAnnotation,
  toAnnotation,
  type AnnotationRow,
} from './annotation.ts';

const noteIdOf = (req: Request): number => Number((req.params as Record<string, string>)['noteId']);

export const annotationsRoutes = (database: DatabaseSync): Router => {
  const findNote = database.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
  const listAnnotations = database.prepare(
    'SELECT * FROM annotations WHERE note_id = ? ORDER BY page, id',
  );
  const insertAnnotation = database.prepare(
    `INSERT INTO annotations (note_id, kind, page, text, rects, y, side, color, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  );
  const updateAnnotation = database.prepare(
    `UPDATE annotations SET color = ?, comment = ?, y = ?, side = ?
      WHERE id = ? AND note_id = ? RETURNING *`,
  );
  const findAnnotation = database.prepare('SELECT * FROM annotations WHERE id = ? AND note_id = ?');
  const deleteAnnotation = database.prepare('DELETE FROM annotations WHERE id = ? AND note_id = ?');

  return Router({ mergeParams: true })
    .use(requireUser(database))
    .use((req, res: AuthenticatedResponse, next) =>
      findNote.get(noteIdOf(req), res.locals.user.id) ? next() : res.sendStatus(404),
    )
    .get('/', (req, res) => {
      const rows = listAnnotations.all(noteIdOf(req)) as unknown as AnnotationRow[];
      res.json(rows.map(toAnnotation));
    })
    .post('/', (req, res) => {
      const annotation = parseNewAnnotation(req.body);
      if (!annotation) return void res.sendStatus(400);
      const { kind, page, text, rects, y, side, color, comment } = annotation;
      const row = insertAnnotation.get(
        noteIdOf(req),
        kind,
        page,
        text,
        rects,
        y,
        side,
        color,
        comment,
      ) as unknown as AnnotationRow;
      res.status(201).json(toAnnotation(row));
    })
    .put('/:annotationId', (req, res) => {
      const noteId = noteIdOf(req);
      const current = findAnnotation.get(Number(req.params['annotationId']), noteId) as
        AnnotationRow | undefined;
      if (!current) return void res.sendStatus(404);
      const change = parseAnnotationChange(req.body, current);
      if (!change) return void res.sendStatus(400);
      const row = updateAnnotation.get(
        change.color,
        change.comment,
        change.y,
        change.side,
        current.id,
        noteId,
      ) as unknown as AnnotationRow;
      res.json(toAnnotation(row));
    })
    .delete('/:annotationId', (req, res) => {
      const { changes } = deleteAnnotation.run(Number(req.params['annotationId']), noteIdOf(req));
      res.sendStatus(changes ? 204 : 404);
    });
};
