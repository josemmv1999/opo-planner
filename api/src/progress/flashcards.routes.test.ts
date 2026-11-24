import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { database, request, signUp } = startTestServer();

let cookie: string;

before(async () => {
  cookie = await signUp('ana@example.com');
  const insert = database.prepare(
    `INSERT INTO questions (topic_id, section, number, statement, options, correct_option, case_text, review_status)
      VALUES (1, ?, 1, ?, '["Tres años","Dos años","Un año","Cinco años"]', 0, ?, ?)`,
  );
  ['A', 'B', 'C'].forEach((name) =>
    insert.run('PRIMERA PARTE', `Pregunta ${name}`, null, 'approved'),
  );
  insert.run('SUPUESTO I', 'Supuesto', 'Caso', 'approved');
  insert.run('GENERADA', 'Pendiente', null, 'pending');
});

const statements = async (count: number): Promise<string[]> => {
  const cards = await (await request(`/api/flashcards?count=${count}`, { cookie })).json();
  return cards.map(({ text }: { text: string }) => text.split(' → ')[0]);
};

test('serves approved test questions and does not repeat them until all are seen', async () => {
  const first = await statements(2);
  const second = await statements(1);
  assert.deepEqual([...first, ...second].sort(), ['Pregunta A', 'Pregunta B', 'Pregunta C']);
  assert.equal((await statements(3)).length, 3);
});

test('shows the right answer in the explanation', async () => {
  const [card] = await (await request('/api/flashcards?count=1', { cookie })).json();
  assert.match(card.explanation, /^Respuesta correcta: Tres años/);
  assert.equal(card.isTrue, card.text.endsWith('→ Tres años'));
});

test('needs a session', async () => {
  assert.equal((await request('/api/flashcards')).status, 401);
});
