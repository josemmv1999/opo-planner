import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword } from './password.ts';

test('verifies only the original password', async () => {
  const stored = await hashPassword('secret123');
  assert.notEqual(stored, 'secret123');
  assert.equal(await verifyPassword('secret123', stored), true);
  assert.equal(await verifyPassword('other', stored), false);
});
