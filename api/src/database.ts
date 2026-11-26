import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  fuengirolaSeedSql,
  fuengirolaSharedTextsSql,
  syllabusSeedSql,
} from './syllabus/syllabus-seed.ts';

export const DB_FILE = process.env.DB_FILE ?? 'data/opo-planner.db';
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? join(dirname(DB_FILE), 'uploads'));

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
  syllabusSeedSql(0, 5),
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
  syllabusSeedSql(5),
  `CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics (id),
    title TEXT NOT NULL,
    kind TEXT NOT NULL,
    content TEXT,
    file_name TEXT,
    mime_type TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX notes_user_id ON notes (user_id)`,
  `CREATE TABLE annotations (
    id INTEGER PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    page INTEGER NOT NULL,
    text TEXT,
    rects TEXT,
    y REAL,
    side TEXT,
    color TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX annotations_note_id ON annotations (note_id)`,
  `CREATE TABLE studied_topics (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics (id),
    PRIMARY KEY (user_id, topic_id)
  )`,
  `CREATE TABLE flashcard_views (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, question_id)
  )`,
  `CREATE TABLE planner_entries (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    is_done INTEGER NOT NULL DEFAULT 0,
    is_record INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX planner_entries_user_start ON planner_entries (user_id, start)`,
  `ALTER TABLE users ADD COLUMN exam_date TEXT`,
  `ALTER TABLE users ADD COLUMN study_schedule TEXT`,
  `ALTER TABLE users ADD COLUMN opposition_ids TEXT`,
  `ALTER TABLE users ADD COLUMN active_opposition_id TEXT`,
  `ALTER TABLE syllabus_blocks ADD COLUMN opposition_id TEXT NOT NULL DEFAULT 'age-c1'`,
  `CREATE TABLE opposition_topics (
    opposition_id TEXT NOT NULL,
    block_id INTEGER NOT NULL REFERENCES syllabus_blocks (id),
    topic_id INTEGER NOT NULL REFERENCES topics (id),
    number INTEGER NOT NULL,
    PRIMARY KEY (opposition_id, topic_id)
  )`,
  `INSERT INTO opposition_topics SELECT 'age-c1', block_id, id, number FROM topics`,
  fuengirolaSeedSql(),
  `ALTER TABLE exams ADD COLUMN opposition_id TEXT NOT NULL DEFAULT 'age-c1'`,
  `ALTER TABLE exam_attempts ADD COLUMN opposition_id TEXT NOT NULL DEFAULT 'age-c1'`,
  `ALTER TABLE planner_entries ADD COLUMN opposition_id TEXT NOT NULL DEFAULT 'age-c1'`,
  `CREATE TABLE opposition_settings (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    opposition_id TEXT NOT NULL,
    exam_date TEXT,
    study_schedule TEXT,
    PRIMARY KEY (user_id, opposition_id)
  )`,
  `INSERT INTO opposition_settings SELECT id, 'age-c1', exam_date, study_schedule FROM users
    WHERE exam_date IS NOT NULL OR study_schedule IS NOT NULL`,
  `ALTER TABLE opposition_topics ADD COLUMN name TEXT`,
  `ALTER TABLE opposition_topics ADD COLUMN description TEXT`,
  fuengirolaSharedTextsSql(),
  `CREATE TABLE topic_materials (
    id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics (id),
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
  )`,
  `CREATE INDEX topic_materials_topic_id ON topic_materials (topic_id)`,
  `CREATE TABLE material_annotations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES topic_materials (id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    page INTEGER NOT NULL,
    text TEXT,
    rects TEXT,
    y REAL,
    side TEXT,
    color TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX material_annotations_user_material ON material_annotations (user_id, material_id)`,
  `ALTER TABLE annotations ADD COLUMN width REAL`,
  `ALTER TABLE material_annotations ADD COLUMN width REAL`,
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
