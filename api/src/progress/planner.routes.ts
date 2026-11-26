import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { syllabusOppositionOf } from '../syllabus/syllabus-opposition.ts';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';

export const DEFAULT_SCHEDULE = {
  days: [0, 1, 2, 3, 4],
  slots: [{ start: '17:00', end: '20:00' }],
};

interface EntryRow {
  id: number;
  text: string;
  start: string;
  end: string;
  is_done: number;
  is_record: number;
}

const toEntry = (row: EntryRow) => ({
  id: row.id,
  text: row.text,
  start: row.start,
  end: row.end,
  isDone: !!row.is_done,
  isRecord: !!row.is_record,
});

const TIME = /^\d{2}:\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isInstant = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isEntryBody = (
  body: unknown,
): body is { text: string; start: string; end: string; isRecord?: boolean } => {
  const { text, start, end } = (body ?? {}) as Record<string, unknown>;
  return (
    typeof text === 'string' && !!text.trim() && isInstant(start) && isInstant(end) && start < end
  );
};

const isSchedule = (value: unknown): boolean => {
  const { days, slots } = (value ?? {}) as { days?: unknown; slots?: unknown };
  return (
    Array.isArray(days) &&
    days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    Array.isArray(slots) &&
    slots.every((slot) => TIME.test(slot?.start) && TIME.test(slot?.end) && slot.start < slot.end)
  );
};

export const plannerRoutes = (database: DatabaseSync): Router => {
  const oppositionOf = syllabusOppositionOf(database);
  const findSettings = database.prepare(
    'SELECT exam_date, study_schedule FROM opposition_settings WHERE user_id = ? AND opposition_id = ?',
  );
  const listEntries = database.prepare(
    `SELECT * FROM planner_entries WHERE user_id = ? AND opposition_id = ? AND start >= ? AND start < ?
      ORDER BY start`,
  );
  const insertEntry = database.prepare(
    `INSERT INTO planner_entries (user_id, opposition_id, text, start, end, is_record)
      VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
  );
  const updateEntry = database.prepare(
    `UPDATE planner_entries SET text = ?, start = ?, end = ?
      WHERE id = ? AND user_id = ? AND is_record = 0 RETURNING *`,
  );
  const updateDone = database.prepare(
    'UPDATE planner_entries SET is_done = ? WHERE id = ? AND user_id = ? RETURNING *',
  );
  const deleteEntry = database.prepare('DELETE FROM planner_entries WHERE id = ? AND user_id = ?');
  const updateExamDate = database.prepare(
    `INSERT INTO opposition_settings (user_id, opposition_id, exam_date) VALUES (?, ?, ?)
      ON CONFLICT (user_id, opposition_id) DO UPDATE SET exam_date = excluded.exam_date`,
  );
  const updateSchedule = database.prepare(
    `INSERT INTO opposition_settings (user_id, opposition_id, study_schedule) VALUES (?, ?, ?)
      ON CONFLICT (user_id, opposition_id) DO UPDATE SET study_schedule = excluded.study_schedule`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (req, res: AuthenticatedResponse) => {
      const { from, to } = req.query;
      if (!isInstant(from) || !isInstant(to)) return void res.sendStatus(400);
      const userId = res.locals.user.id;
      const oppositionId = oppositionOf(userId);
      const settings = findSettings.get(userId, oppositionId) as
        { exam_date: string | null; study_schedule: string | null } | undefined;
      const rows = listEntries.all(userId, oppositionId, from, to) as unknown as EntryRow[];
      res.json({
        examDate: settings?.exam_date ?? null,
        schedule: settings?.study_schedule ? JSON.parse(settings.study_schedule) : DEFAULT_SCHEDULE,
        otherSchedules: [],
        entries: rows.map(toEntry),
        otherEntries: [],
      });
    })
    .post('/entries', (req, res: AuthenticatedResponse) => {
      if (!isEntryBody(req.body)) return void res.sendStatus(400);
      const { text, start, end } = req.body;
      const row = insertEntry.get(
        res.locals.user.id,
        oppositionOf(res.locals.user.id),
        text.trim(),
        start,
        end,
        req.body.isRecord === true ? 1 : 0,
      ) as unknown as EntryRow;
      res.status(201).json(toEntry(row));
    })
    .put('/entries/:id', (req, res: AuthenticatedResponse) => {
      if (!isEntryBody(req.body)) return void res.sendStatus(400);
      const { text, start, end } = req.body;
      const row = updateEntry.get(
        text.trim(),
        start,
        end,
        Number(req.params['id']),
        res.locals.user.id,
      ) as EntryRow | undefined;
      if (!row) return void res.sendStatus(404);
      res.json(toEntry(row));
    })
    .put('/entries/:id/done', (req, res: AuthenticatedResponse) => {
      const { isDone } = req.body ?? {};
      if (typeof isDone !== 'boolean') return void res.sendStatus(400);
      const row = updateDone.get(isDone ? 1 : 0, Number(req.params['id']), res.locals.user.id) as
        EntryRow | undefined;
      if (!row) return void res.sendStatus(404);
      res.json(toEntry(row));
    })
    .delete('/entries/:id', (req, res: AuthenticatedResponse) => {
      const { changes } = deleteEntry.run(Number(req.params['id']), res.locals.user.id);
      res.sendStatus(changes ? 204 : 404);
    })
    .put('/exam-date', (req, res: AuthenticatedResponse) => {
      const { date } = req.body ?? {};
      if (typeof date !== 'string' || !DATE.test(date)) return void res.sendStatus(400);
      updateExamDate.run(res.locals.user.id, oppositionOf(res.locals.user.id), date);
      res.json({ date });
    })
    .put('/schedule', (req, res: AuthenticatedResponse) => {
      if (!isSchedule(req.body)) return void res.sendStatus(400);
      const { days, slots } = req.body;
      const schedule = { days, slots };
      updateSchedule.run(
        res.locals.user.id,
        oppositionOf(res.locals.user.id),
        JSON.stringify(schedule),
      );
      res.json(schedule);
    });
};
