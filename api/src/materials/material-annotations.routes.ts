import type { DatabaseSync } from 'node:sqlite';
import { Router, type Request } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import {
  parseAnnotationChange,
  parseNewAnnotation,
  toAnnotation,
  type AnnotationRow,
} from '../notes/annotation.ts';

const materialIdOf = (req: Request): number =>
  Number((req.params as Record<string, string>)['materialId']);

export const materialAnnotationsRoutes = (database: DatabaseSync): Router => {
  const findMaterial = database.prepare('SELECT id FROM topic_materials WHERE id = ?');
  const listAnnotations = database.prepare(
    'SELECT * FROM material_annotations WHERE material_id = ? AND user_id = ? ORDER BY page, id',
  );
  const insertAnnotation = database.prepare(
    `INSERT INTO material_annotations
      (user_id, material_id, kind, page, text, rects, y, side, color, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  );
  const updateAnnotation = database.prepare(
    `UPDATE material_annotations SET color = ?, comment = ?, y = ?, side = ?
      WHERE id = ? AND material_id = ? AND user_id = ? RETURNING *`,
  );
  const findAnnotation = database.prepare(
    'SELECT * FROM material_annotations WHERE id = ? AND material_id = ? AND user_id = ?',
  );
  const deleteAnnotation = database.prepare(
    'DELETE FROM material_annotations WHERE id = ? AND material_id = ? AND user_id = ?',
  );

  return Router({ mergeParams: true })
    .use(requireUser(database))
    .use((req, res, next) => (findMaterial.get(materialIdOf(req)) ? next() : res.sendStatus(404)))
    .get('/', (req, res: AuthenticatedResponse) => {
      const rows = listAnnotations.all(
        materialIdOf(req),
        res.locals.user.id,
      ) as unknown as AnnotationRow[];
      res.json(rows.map(toAnnotation));
    })
    .post('/', (req, res: AuthenticatedResponse) => {
      const annotation = parseNewAnnotation(req.body);
      if (!annotation) return void res.sendStatus(400);
      const { kind, page, text, rects, y, side, color, comment } = annotation;
      const row = insertAnnotation.get(
        res.locals.user.id,
        materialIdOf(req),
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
    .put('/:annotationId', (req, res: AuthenticatedResponse) => {
      const keys = [Number(req.params['annotationId']), materialIdOf(req), res.locals.user.id];
      const current = findAnnotation.get(...keys) as AnnotationRow | undefined;
      if (!current) return void res.sendStatus(404);
      const change = parseAnnotationChange(req.body, current);
      if (!change) return void res.sendStatus(400);
      const row = updateAnnotation.get(
        change.color,
        change.comment,
        change.y,
        change.side,
        ...keys,
      ) as unknown as AnnotationRow;
      res.json(toAnnotation(row));
    })
    .delete('/:annotationId', (req, res: AuthenticatedResponse) => {
      const { changes } = deleteAnnotation.run(
        Number(req.params['annotationId']),
        materialIdOf(req),
        res.locals.user.id,
      );
      res.sendStatus(changes ? 204 : 404);
    });
};
