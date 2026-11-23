import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openDatabase } from './database.ts';

test('creates the users table', () => {
  const database = openDatabase(':memory:');
  database
    .prepare('INSERT INTO users (name, surname, email, password_hash) VALUES (?, ?, ?, ?)')
    .run('Ana', 'López', 'ana@example.com', 'hash');
  assert.deepEqual(
    { ...database.prepare('SELECT name, is_admin FROM users').get() },
    {
      name: 'Ana',
      is_admin: 0,
    },
  );
});

test('runs each migration only once', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'opo-api-')), 'test.db');
  openDatabase(file).close();
  assert.doesNotThrow(() => openDatabase(file).close());
});
