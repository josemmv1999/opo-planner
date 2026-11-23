import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

const result = (topicId: number) => ({
  topicId,
  date: '2026-11-23T10:00:00.000Z',
  percentage: 80,
  mistakes: [
    {
      questionId: 7,
      statement: '¿?',
      options: ['a', 'b', 'c', 'd'],
      chosenOption: 0,
      correctOption: 1,
      reasoning: '',
    },
  ],
  correctQuestionIds: [1, 2, 3],
  isReview: false,
});

const save = (cookie: string, body: object) =>
  request('/api/topic-results', { method: 'POST', cookie, body: JSON.stringify(body) });

test('saves results and lists only the user ones, optionally by topic', async () => {
  const ana = await signUp('ana@example.com');
  const luis = await signUp('luis@example.com');
  const response = await save(ana, result(1));
  assert.equal(response.status, 201);
  assert.deepEqual({ ...(await response.json()), id: 0 }, { ...result(1), id: 0 });
  await save(ana, result(2));
  await save(luis, result(1));

  const all = await (await request('/api/topic-results', { cookie: ana })).json();
  assert.deepEqual(
    all.map(({ topicId }: { topicId: number }) => topicId),
    [1, 2],
  );
  const topic2 = await (await request('/api/topic-results?topicId=2', { cookie: ana })).json();
  assert.equal(topic2.length, 1);
});

test('rejects an invalid result or an unknown topic', async () => {
  const cookie = await signUp('eva@example.com');
  assert.equal((await save(cookie, { ...result(1), percentage: '80' })).status, 400);
  assert.equal((await save(cookie, result(999))).status, 400);
});
