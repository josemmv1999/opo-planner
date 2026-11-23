import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startTestServer } from '../testing.ts';
import type { ParsedQuestion } from './question.ts';

const { request, signUp } = startTestServer();

const question: ParsedQuestion = {
  section: 'PRIMERA PARTE',
  number: 1,
  isReserve: false,
  caseText: null,
  statement: '¿Quién sanciona las leyes?',
  options: ['El Rey', 'El Gobierno', 'El Congreso', 'El Senado'],
  correctOption: 0,
  isVoided: false,
  topicId: 3,
};

const importExam = (cookie: string, body: object) =>
  request('/api/admin/exams', { method: 'POST', cookie, body: JSON.stringify(body) });

test('only admins can use the admin exam routes', async () => {
  assert.equal((await request('/api/admin/exams')).status, 401);
  const cookie = await signUp('user@example.com');
  assert.equal((await request('/api/admin/exams', { cookie })).status, 403);
});

test('imports, lists and deletes an exam', async () => {
  const cookie = await signUp('admin@example.com', { isAdmin: true });
  const response = await importExam(cookie, { name: ' Convocatoria 2025 ', questions: [question] });
  assert.equal(response.status, 201);
  const { id, name, questions } = await response.json();
  assert.equal(name, 'Convocatoria 2025');
  assert.deepEqual(questions, [question]);

  const listed = await (await request('/api/admin/exams', { cookie })).json();
  assert.deepEqual(
    listed.map((exam: { id: number }) => exam.id),
    [id],
  );

  assert.equal((await request(`/api/admin/exams/${id}`, { method: 'DELETE', cookie })).status, 204);
  assert.equal((await request(`/api/admin/exams/${id}`, { method: 'DELETE', cookie })).status, 404);
});

test('rejects an exam without name or questions', async () => {
  const cookie = await signUp('admin2@example.com', { isAdmin: true });
  assert.equal((await importExam(cookie, { name: '', questions: [question] })).status, 400);
  assert.equal((await importExam(cookie, { name: '2025', questions: [] })).status, 400);
  assert.equal(
    (await importExam(cookie, { name: '2025', questions: [{ ...question, options: 'a' }] })).status,
    400,
  );
});

test('suggests a topic for each question', async () => {
  const cookie = await signUp('admin3@example.com', { isAdmin: true });
  const response = await request('/api/admin/exams/classify', {
    method: 'POST',
    cookie,
    body: JSON.stringify({
      questions: [
        {
          statement: 'De acuerdo con el artículo 67 de la Constitución Española de 1978:',
          options: [],
        },
        { statement: '¿Qué función de Excel 365 invierte un valor lógico?', options: ['NO', 'SI'] },
      ],
    }),
  });
  assert.deepEqual(await response.json(), [3, 42]);
});
