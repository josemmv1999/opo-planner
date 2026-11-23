import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';
import type { ParsedQuestion } from './question.ts';

const { database, request, signUp } = startTestServer();

const question = (number: number, overrides: Partial<ParsedQuestion> = {}): ParsedQuestion => ({
  section: 'PRIMERA PARTE',
  number,
  isReserve: false,
  caseText: null,
  statement: `Pregunta ${number}`,
  options: ['a', 'b', 'c', 'd'],
  correctOption: 1,
  isVoided: false,
  ...overrides,
});

let cookie: string;
let examId: number;

before(async () => {
  const admin = await signUp('admin@example.com', { isAdmin: true });
  const body = JSON.stringify({
    name: 'Convocatoria 2025',
    questions: [
      question(1),
      question(2),
      question(3, { isVoided: true }),
      question(1, { isReserve: true }),
    ],
  });
  ({ id: examId } = await (
    await request('/api/admin/exams', { method: 'POST', cookie: admin, body })
  ).json());
  cookie = await signUp('ana@example.com');
});

test('lists exams with their usable question count and last result', async () => {
  const user = database.prepare("SELECT id FROM users WHERE email = 'ana@example.com'").get() as {
    id: number;
  };
  database
    .prepare(
      "INSERT INTO exam_attempts (user_id, kind, name, date, minutes_taken, percentage) VALUES (?, 'official', 'Convocatoria 2025', '2026-11-23', 40, 75)",
    )
    .run(user.id);
  assert.deepEqual(await (await request('/api/exams', { cookie })).json(), [
    { id: examId, name: 'Convocatoria 2025', minutes: 60, questionCount: 2, lastPercentage: 75 },
  ]);
});

test('returns an exam without reserve or voided questions', async () => {
  const exam = await (await request(`/api/exams/${examId}`, { cookie })).json();
  assert.equal(exam.id, String(examId));
  assert.deepEqual(
    exam.questions.map(({ statement, block }: { statement: string; block: string }) => [
      statement,
      block,
    ]),
    [
      ['Pregunta 1', 'PRIMERA PARTE'],
      ['Pregunta 2', 'PRIMERA PARTE'],
    ],
  );
  assert.equal((await request('/api/exams/999', { cookie })).status, 404);
});

test('builds a mixed exam from all usable questions', async () => {
  const exam = await (await request('/api/exams/mixed', { cookie })).json();
  assert.equal(exam.name, 'Batiburrillo');
  assert.equal(exam.questions.length, 2);
});

test('needs a session', async () => {
  assert.equal((await request('/api/exams')).status, 401);
});
