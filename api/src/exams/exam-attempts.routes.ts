import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { syllabusOppositionOf } from '../syllabus/syllabus-opposition.ts';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';

const KINDS = new Set(['official', 'mixed', 'custom']);

const ATTEMPT_COLUMNS = 'id, kind, name, date, minutes_taken AS minutesTaken, percentage';

export const examAttemptsRoutes = (database: DatabaseSync): Router => {
  const oppositionOf = syllabusOppositionOf(database);
  const listAttempts = database.prepare(
    `SELECT ${ATTEMPT_COLUMNS} FROM exam_attempts WHERE user_id = ? AND opposition_id = ? ORDER BY id DESC`,
  );
  const insertAttempt = database.prepare(
    `INSERT INTO exam_attempts (user_id, opposition_id, kind, name, date, minutes_taken, percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING ${ATTEMPT_COLUMNS}`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res: AuthenticatedResponse) => {
      res.json(listAttempts.all(res.locals.user.id, oppositionOf(res.locals.user.id)));
    })
    .post('/', (req, res: AuthenticatedResponse) => {
      const { kind, name, date, minutesTaken, percentage } = req.body ?? {};
      const isValid =
        KINDS.has(kind) &&
        typeof name === 'string' &&
        typeof date === 'string' &&
        Number.isInteger(minutesTaken) &&
        Number.isInteger(percentage);
      if (!isValid) return void res.sendStatus(400);
      res
        .status(201)
        .json(
          insertAttempt.get(
            res.locals.user.id,
            oppositionOf(res.locals.user.id),
            kind,
            name,
            date,
            minutesTaken,
            percentage,
          ),
        );
    });
};
