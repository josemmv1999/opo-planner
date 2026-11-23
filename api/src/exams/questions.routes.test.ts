import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { database, request, signUp } = startTestServer();

let cookie: string;

before(async () => {
  const insert = database.prepare(
    `INSERT INTO questions (topic_id, section, number, statement, options, correct_option, is_voided)
      VALUES (?, 'PRIMERA PARTE', 1, ?, '["a","b","c","d"]', ?, ?)`,
  );
  insert.run(1, 'Tema 1 A', 0, 0);
  insert.run(1, 'Tema 1 B', 1, 0);
  insert.run(1, 'Tema 1 anulada', null, 1);
  insert.run(2, 'Tema 2', 2, 0);
  insert.run(null, 'Sin tema', 3, 0);
  database
    .prepare(
      `INSERT INTO questions (topic_id, section, number, case_text, statement, options, correct_option)
        VALUES (1, 'SUPUESTO I', 1, 'Caso', 'Tema 1 supuesto', '["a","b","c","d"]', 0)`,
    )
    .run();
  cookie = await signUp('ana@example.com');
});

const statements = async (query: string): Promise<string[]> => {
  const questions = await (await request(`/api/questions?${query}`, { cookie })).json();
  return questions.map(({ statement }: { statement: string }) => statement).sort();
};

test('returns usable test questions of the chosen topics, never case questions', async () => {
  assert.deepEqual(await statements('topicIds=1&count=10'), ['Tema 1 A', 'Tema 1 B']);
  assert.deepEqual(await statements('topicIds=1,2&count=10'), ['Tema 1 A', 'Tema 1 B', 'Tema 2']);
});

test('limits the number of questions', async () => {
  assert.equal((await statements('topicIds=1,2&count=2')).length, 2);
});

test('needs topics and a count', async () => {
  assert.equal((await request('/api/questions?count=5', { cookie })).status, 400);
  assert.equal((await request('/api/questions?topicIds=1', { cookie })).status, 400);
});
