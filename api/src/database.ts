import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

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
