import type { DatabaseSync } from 'node:sqlite';
import { Router, type Request } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';

export const ANNOTATION_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];
const TEXT_KINDS = ['highlight', 'underline'];

interface AnnotationRow {
  id: number;
  kind: 'highlight' | 'underline' | 'margin';
  page: number;
  text: string | null;
  rects: string | null;
  y: number | null;
  side: 'left' | 'right' | null;
  color: string;
  comment: string;
}

const toAnnotation = (row: AnnotationRow) => ({
  id: row.id,
  kind: row.kind,
  page: row.page,
  color: row.color,
  comment: row.comment,
  ...(row.kind !== 'margin'
    ? { text: row.text, rects: JSON.parse(row.rects ?? '[]') as unknown[] }
    : { y: row.y, side: row.side }),
});

const isRect = (rect: unknown): boolean =>
  ['x', 'y', 'width', 'height'].every(
    (key) => typeof (rect as Record<string, unknown>)?.[key] === 'number',
  );

const noteIdOf = (req: Request): number => Number((req.params as Record<string, string>)['noteId']);

const isPercent = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 100;

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
    `UPDATE annotations SET kind = ?, color = ?, comment = ?, y = ?, side = ?
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
      const { kind, page, text, rects, y, side, color, comment = '' } = req.body ?? {};
      const isHighlight =
        TEXT_KINDS.includes(kind) &&
        typeof text === 'string' &&
        Array.isArray(rects) &&
        rects.length > 0 &&
        rects.every(isRect);
      const isMargin = kind === 'margin' && isPercent(y) && (side === 'left' || side === 'right');
      const isValid =
        (isHighlight || isMargin) &&
        Number.isInteger(page) &&
        page > 0 &&
        ANNOTATION_COLORS.includes(color) &&
        typeof comment === 'string';
      if (!isValid) return void res.sendStatus(400);
      const row = insertAnnotation.get(
        noteIdOf(req),
        kind,
        page,
        isHighlight ? text : null,
        isHighlight ? JSON.stringify(rects) : null,
        isMargin ? y : null,
        isMargin ? side : null,
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
      const {
        kind = current.kind,
        color = current.color,
        comment = current.comment,
        y = current.y,
        side = current.side,
      } = req.body ?? {};
      const isPlaceValid =
        current.kind === 'margin'
          ? kind === 'margin' && isPercent(y) && (side === 'left' || side === 'right')
          : TEXT_KINDS.includes(kind) && y === null && side === null;
      if (!ANNOTATION_COLORS.includes(color) || typeof comment !== 'string' || !isPlaceValid)
        return void res.sendStatus(400);
      const row = updateAnnotation.get(
        kind,
        color,
        comment,
        y,
        side,
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
