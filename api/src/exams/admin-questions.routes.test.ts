import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

const generated = {
  topic: 'III.3',
  statement: 'Si la norma no fija plazo, ¿cuál es el plazo máximo para resolver?',
  options: ['Un mes', 'Tres meses', 'Seis meses', 'Un año'],
  correctOption: 1,
  explanation: 'Tres meses si la norma no fija plazo.',
  source: 'Ley 39/2015, art. 21.3',
};

let cookie: string;

before(async () => {
  cookie = await signUp('admin@example.com', { isAdmin: true });
});

const importQuestions = (questions: unknown[]) =>
  request('/api/admin/questions/import', {
    method: 'POST',
    cookie,
    body: JSON.stringify({ questions }),
  });

test('imports valid questions as pending and reports the invalid ones', async () => {
  const response = await importQuestions([
    generated,
    { ...generated, topic: 'IX.1' },
    { ...generated, topic: 'III.99' },
    { ...generated, options: ['a', 'b'] },
    { ...generated, correctOption: 4 },
  ]);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    imported: 1,
    errors: [
      { index: 1, reason: 'topic' },
      { index: 2, reason: 'topic' },
      { index: 3, reason: 'format' },
      { index: 4, reason: 'format' },
    ],
  });

  const pending = await (await request('/api/admin/questions/pending', { cookie })).json();
  assert.deepEqual(pending, [
    {
      id: pending[0].id,
      topicId: 18,
      statement: generated.statement,
      options: generated.options,
      correctOption: 1,
      explanation: generated.explanation,
      source: generated.source,
    },
  ]);
});

test('is only for admins', async () => {
  const user = await signUp('user@example.com');
  assert.equal((await request('/api/admin/questions/pending', { cookie: user })).status, 403);
});
