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

test('deletes the questions of a deleted exam', () => {
  const database = openDatabase(':memory:');
  const { id } = database
    .prepare("INSERT INTO exams (name) VALUES ('2025') RETURNING id")
    .get() as {
    id: number;
  };
  database
    .prepare(
      "INSERT INTO questions (exam_id, section, number, statement, options) VALUES (?, 'PRIMERA PARTE', 1, '¿?', '[]')",
    )
    .run(id);
  database.prepare('DELETE FROM exams WHERE id = ?').run(id);
  assert.deepEqual(
    { ...database.prepare('SELECT COUNT(*) AS count FROM questions').get() },
    { count: 0 },
  );
});

test('seeds the AGE C1 and Fuengirola syllabi', () => {
  const database = openDatabase(':memory:');
  const blocks = database
    .prepare(
      'SELECT label, COUNT(*) AS topics FROM syllabus_blocks JOIN opposition_topics ON opposition_topics.block_id = syllabus_blocks.id GROUP BY syllabus_blocks.id ORDER BY syllabus_blocks.id',
    )
    .all()
    .map((row) => ({ ...row }));
  assert.deepEqual(blocks, [
    { label: 'Bloque I', topics: 11 },
    { label: 'Bloque II', topics: 4 },
    { label: 'Bloque III', topics: 7 },
    { label: 'Bloque IV', topics: 9 },
    { label: 'Bloque V', topics: 6 },
    { label: 'Bloque VI', topics: 8 },
    { label: 'Bloque A', topics: 19 },
    { label: 'Bloque B', topics: 22 },
  ]);
});

test('marks existing and imported questions as official and approved', () => {
  const database = openDatabase(':memory:');
  database
    .prepare(
      "INSERT INTO questions (section, number, statement, options) VALUES ('PRIMERA PARTE', 1, '¿?', '[]')",
    )
    .run();
  assert.deepEqual(
    { ...database.prepare('SELECT is_official, review_status, explanation FROM questions').get() },
    { is_official: 1, review_status: 'approved', explanation: null },
  );
});
