import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { backupDatabase } from './backup.ts';
import { openDatabase } from './database.ts';

test('copies the database and keeps only the newest backups', async () => {
  const database = openDatabase(':memory:');
  database
    .prepare('INSERT INTO users (name, surname, email, password_hash) VALUES (?, ?, ?, ?)')
    .run('Ana', 'López', 'ana@example.com', 'hash');
  const dir = join(mkdtempSync(join(tmpdir(), 'opo-backups-')), 'backups');

  const days = ['2026-11-20', '2026-11-21', '2026-11-22'];
  const files = [];
  for (const day of days)
    files.push(await backupDatabase(database, dir, { keep: 2, now: new Date(`${day}T10:00:00Z`) }));

  assert.deepEqual(
    readdirSync(dir).sort(),
    files.slice(1).map((file) => basename(file)),
  );
  const copy = new DatabaseSync(files.at(-1)!);
  assert.deepEqual(
    { ...copy.prepare('SELECT email FROM users').get() },
    { email: 'ana@example.com' },
  );
  copy.close();
});
