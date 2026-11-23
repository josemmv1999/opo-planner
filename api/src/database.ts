import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SYLLABUS_SEED_SQL } from './syllabus/syllabus-seed.ts';

export const DB_FILE = process.env.DB_FILE ?? 'data/opo-planner.db';

const MIGRATIONS = [
  `CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    has_completed_onboarding INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE exams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    minutes INTEGER NOT NULL DEFAULT 60,
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    exam_id INTEGER REFERENCES exams (id) ON DELETE CASCADE,
    topic_id INTEGER,
    section TEXT NOT NULL,
    number INTEGER NOT NULL,
    is_reserve INTEGER NOT NULL DEFAULT 0,
    case_text TEXT,
    statement TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_option INTEGER,
    is_voided INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX questions_exam_id ON questions (exam_id)`,
  `CREATE TABLE exam_attempts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    minutes_taken INTEGER NOT NULL,
    percentage INTEGER NOT NULL
  )`,
  `CREATE INDEX exam_attempts_user_id ON exam_attempts (user_id)`,
  `CREATE TABLE syllabus_blocks (
    id INTEGER PRIMARY KEY,
    label TEXT NOT NULL,
    name TEXT NOT NULL
  )`,
  `CREATE TABLE topics (
    id INTEGER PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES syllabus_blocks (id),
    number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  )`,
  SYLLABUS_SEED_SQL,
  `CREATE TABLE topic_results (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics (id),
    date TEXT NOT NULL,
    percentage INTEGER NOT NULL,
    mistakes TEXT NOT NULL,
    correct_question_ids TEXT NOT NULL,
    is_review INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX topic_results_user_id ON topic_results (user_id)`,
  `ALTER TABLE questions ADD COLUMN is_official INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE questions ADD COLUMN review_status TEXT NOT NULL DEFAULT 'approved'`,
  `ALTER TABLE questions ADD COLUMN explanation TEXT`,
  `ALTER TABLE questions ADD COLUMN source TEXT`,
];

const migrate = (database: DatabaseSync): void => {
  const { user_version: version } = database.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  MIGRATIONS.slice(version).forEach((sql, i) => {
    database.exec(sql);
    database.exec(`PRAGMA user_version = ${version + i + 1}`);
  });
};

export const openDatabase = (file: string): DatabaseSync => {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec('PRAGMA foreign_keys = ON');
  migrate(database);
  return database;
};
