import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { requireUser, type AuthenticatedResponse } from '../auth/require-user.ts';
import { syllabusOppositionOf } from '../syllabus/syllabus-opposition.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_SHOWN = 7;
const WEAK_BLOCKS_SHOWN = 3;
const WEAK_PERCENTAGE = 70;

const localDate = (value: string | Date): string => new Date(value).toLocaleDateString('sv-SE');

const daysAgo = (days: number, now: Date): string =>
  localDate(new Date(now.getTime() - days * DAY_MS));

const streakOf = (studiedDays: Set<string>, now: Date): number => {
  const start = studiedDays.has(daysAgo(0, now)) ? 0 : 1;
  let streak = 0;
  while (studiedDays.has(daysAgo(start + streak, now))) streak++;
  return streak;
};

export const homeRoutes = (database: DatabaseSync, now: () => Date = () => new Date()): Router => {
  const oppositionOf = syllabusOppositionOf(database);
  const findUser = database.prepare(
    `SELECT created_at, opposition_settings.exam_date FROM users
      LEFT JOIN opposition_settings ON opposition_settings.user_id = users.id
        AND opposition_settings.opposition_id = ?
      WHERE users.id = ?`,
  );
  const listActivity = database.prepare(
    `SELECT date FROM topic_results WHERE user_id = ?
      UNION ALL SELECT date FROM exam_attempts WHERE user_id = ?`,
  );
  const listStudiedBlocks = database.prepare(
    `SELECT syllabus_blocks.id, syllabus_blocks.name FROM syllabus_blocks
      WHERE syllabus_blocks.opposition_id = ? AND NOT EXISTS (
        SELECT 1 FROM opposition_topics WHERE opposition_topics.block_id = syllabus_blocks.id
          AND opposition_topics.topic_id NOT IN (SELECT topic_id FROM studied_topics WHERE user_id = ?)
      )
      ORDER BY syllabus_blocks.id`,
  );
  const listWeakBlocks = database.prepare(
    `SELECT syllabus_blocks.id, syllabus_blocks.name,
        ROUND(AVG(topic_results.percentage)) AS correctPercentage
      FROM topic_results
      JOIN opposition_topics ON opposition_topics.topic_id = topic_results.topic_id
      JOIN syllabus_blocks ON syllabus_blocks.id = opposition_topics.block_id
      WHERE opposition_topics.opposition_id = ? AND topic_results.user_id = ? AND topic_results.is_review = 0
      GROUP BY syllabus_blocks.id
      HAVING correctPercentage < ${WEAK_PERCENTAGE}
      ORDER BY correctPercentage, syllabus_blocks.id
      LIMIT ${WEAK_BLOCKS_SHOWN}`,
  );

  return Router()
    .use(requireUser(database))
    .get('/', (_req, res: AuthenticatedResponse) => {
      const userId = res.locals.user.id;
      const oppositionId = oppositionOf(userId);
      const today = now();
      const { created_at, exam_date } = findUser.get(oppositionId, userId) as {
        created_at: string;
        exam_date: string | null;
      };
      const studiedDays = new Set(
        (listActivity.all(userId, userId) as { date: string }[]).map(({ date }) => localDate(date)),
      );
      res.json({
        examDate: exam_date,
        studyStartDate: localDate(`${created_at.replace(' ', 'T')}Z`),
        streakDays: streakOf(studiedDays, today),
        lastSevenDays: Array.from({ length: DAYS_SHOWN }, (_, i) => {
          const date = daysAgo(DAYS_SHOWN - 1 - i, today);
          return { date, hasStudied: studiedDays.has(date) };
        }),
        studiedBlocks: listStudiedBlocks.all(oppositionId, userId),
        weakBlocks: listWeakBlocks.all(oppositionId, userId),
      });
    });
};
