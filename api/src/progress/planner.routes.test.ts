import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

let cookie: string;
let other: string;

before(async () => {
  cookie = await signUp('ana@example.com');
  other = await signUp('luis@example.com');
});

const send = (path: string, method: string, body: unknown, as = cookie) =>
  request(`/api/planner${path}`, { method, cookie: as, body: JSON.stringify(body) });

const week = async (as = cookie) =>
  (
    await request('/api/planner?from=2026-11-23T00:00:00.000Z&to=2026-11-30T00:00:00.000Z', {
      cookie: as,
    })
  ).json();

test('starts with the default schedule and no exam date', async () => {
  const empty = await week();
  assert.equal(empty.examDate, null);
  assert.deepEqual(empty.schedule.days, [0, 1, 2, 3, 4]);
  assert.deepEqual(empty.entries, []);
});

test('creates, edits, completes and deletes tasks of the week', async () => {
  const task = await (
    await send('/entries', 'POST', {
      text: 'Repasar TREBEP',
      start: '2026-11-24T16:00:00.000Z',
      end: '2026-11-24T17:00:00.000Z',
    })
  ).json();
  await send('/entries', 'POST', {
    text: 'Fuera de la semana',
    start: '2026-12-10T16:00:00.000Z',
    end: '2026-12-10T17:00:00.000Z',
  });
  const edited = await (
    await send(`/entries/${task.id}`, 'PUT', {
      text: 'Repasar Ley 39',
      start: '2026-11-24T16:00:00.000Z',
      end: '2026-11-24T18:00:00.000Z',
    })
  ).json();
  assert.equal(edited.text, 'Repasar Ley 39');
  assert.equal(
    (await (await send(`/entries/${task.id}/done`, 'PUT', { isDone: true })).json()).isDone,
    true,
  );
  assert.deepEqual(
    (await week()).entries.map(({ text }: { text: string }) => text),
    ['Repasar Ley 39'],
  );
  assert.deepEqual((await week(other)).entries, []);
  assert.equal((await send(`/entries/${task.id}`, 'DELETE', undefined)).status, 204);
  assert.deepEqual((await week()).entries, []);
});

test('logs study records that cannot be edited as tasks', async () => {
  const record = await (
    await send('/entries', 'POST', {
      text: 'Examen · Convocatoria 2025 · 80 %',
      start: '2026-11-25T10:00:00.000Z',
      end: '2026-11-25T11:00:00.000Z',
      isRecord: true,
    })
  ).json();
  assert.equal(record.isRecord, true);
  const edit = await send(`/entries/${record.id}`, 'PUT', {
    text: 'x',
    start: '2026-11-25T10:00:00.000Z',
    end: '2026-11-25T11:00:00.000Z',
  });
  assert.equal(edit.status, 404);
});

test('saves the exam date and the study schedule', async () => {
  await send('/exam-date', 'PUT', { date: '2027-06-12' });
  const schedule = { days: [0, 2], slots: [{ start: '09:00', end: '11:00' }] };
  await send('/schedule', 'PUT', schedule);
  const saved = await week();
  assert.equal(saved.examDate, '2027-06-12');
  assert.deepEqual(saved.schedule, schedule);
  assert.equal((await send('/exam-date', 'PUT', { date: '12/06/2027' })).status, 400);
  assert.equal((await send('/schedule', 'PUT', { days: [9], slots: [] })).status, 400);
  assert.equal((await (await request('/api/home', { cookie })).json()).examDate, '2027-06-12');
});

test('keeps tasks, exam date and schedule apart for each opposition', async () => {
  const opos = await signUp('opos@example.com');
  const useOppositions = (ids: string[]) =>
    request('/api/account/oppositions', {
      method: 'PUT',
      cookie: opos,
      body: JSON.stringify({ ids }),
    });
  await send('/exam-date', 'PUT', { date: '2027-06-12' }, opos);
  await send(
    '/entries',
    'POST',
    { text: 'Tema 1', start: '2026-11-24T09:00:00.000Z', end: '2026-11-24T10:00:00.000Z' },
    opos,
  );
  await useOppositions(['ayto-fuengirola-c1', 'age-c1']);
  const fuengirola = await week(opos);
  assert.equal(fuengirola.examDate, null);
  assert.deepEqual(fuengirola.entries, []);
  await useOppositions(['age-c1', 'ayto-fuengirola-c1']);
  const age = await week(opos);
  assert.equal(age.examDate, '2027-06-12');
  assert.equal(age.entries.length, 1);
});

test('needs a session', async () => {
  assert.equal((await request('/api/planner?from=a&to=b')).status, 401);
});
