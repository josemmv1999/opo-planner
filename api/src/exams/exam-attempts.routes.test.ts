import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

const attempt = {
  kind: 'official',
  name: 'Convocatoria 2025',
  date: '2026-11-23T10:00:00.000Z',
  minutesTaken: 42,
  percentage: 80,
};

const save = (cookie: string, body: object) =>
  request('/api/exam-attempts', { method: 'POST', cookie, body: JSON.stringify(body) });

test('saves attempts and lists only the user ones, newest first', async () => {
  const ana = await signUp('ana@example.com');
  const luis = await signUp('luis@example.com');
  const response = await save(ana, attempt);
  assert.equal(response.status, 201);
  assert.deepEqual({ ...(await response.json()), id: 0 }, { ...attempt, id: 0 });
  await save(ana, { ...attempt, kind: 'mixed', name: 'Batiburrillo' });
  await save(luis, attempt);

  const history = await (await request('/api/exam-attempts', { cookie: ana })).json();
  assert.deepEqual(
    history.map(({ name }: { name: string }) => name),
    ['Batiburrillo', 'Convocatoria 2025'],
  );
});

test('rejects an invalid attempt', async () => {
  const cookie = await signUp('eva@example.com');
  assert.equal((await save(cookie, { ...attempt, kind: 'other' })).status, 400);
  assert.equal((await save(cookie, { ...attempt, percentage: '80' })).status, 400);
});

test('keeps a separate history for each opposition', async () => {
  const cookie = await signUp('two-opos@example.com');
  const useOppositions = (ids: string[]) =>
    request('/api/account/oppositions', { method: 'PUT', cookie, body: JSON.stringify({ ids }) });
  await save(cookie, attempt);
  await useOppositions(['ayto-fuengirola-c1', 'age-c1']);
  assert.deepEqual(await (await request('/api/exam-attempts', { cookie })).json(), []);
  await useOppositions(['age-c1', 'ayto-fuengirola-c1']);
  assert.equal((await (await request('/api/exam-attempts', { cookie })).json()).length, 1);
});
