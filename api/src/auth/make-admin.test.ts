import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDatabase } from '../database.ts';
import { makeAdmin } from './make-admin.ts';

test('makes an existing user admin', () => {
  const database = openDatabase(':memory:');
  database
    .prepare('INSERT INTO users (name, surname, email, password_hash) VALUES (?, ?, ?, ?)')
    .run('Ana', 'López', 'ana@example.com', 'hash');
  assert.equal(makeAdmin(database, 'ANA@example.com'), true);
  assert.deepEqual({ ...database.prepare('SELECT is_admin FROM users').get() }, { is_admin: 1 });
  assert.equal(makeAdmin(database, 'nobody@example.com'), false);
});
