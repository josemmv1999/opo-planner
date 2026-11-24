import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { database, request, signUp } = startTestServer();

let cookie: string;

const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString('sv-SE');
};

before(async () => {
  cookie = await signUp('ana@example.com');
  const { id } = database.prepare("SELECT id FROM users WHERE email = 'ana@example.com'").get() as {
    id: number;
  };
  const result = database.prepare(
    `INSERT INTO topic_results (user_id, topic_id, date, percentage, mistakes, correct_question_ids)
      VALUES (?, ?, ?, ?, '[]', '[]')`,
  );
  result.run(id, 1, `${daysAgo(0)}T10:00:00`, 40);
  result.run(id, 12, `${daysAgo(1)}T10:00:00`, 90);
  result.run(id, 2, `${daysAgo(3)}T10:00:00`, 60);
  database
    .prepare(
      "INSERT INTO exam_attempts (user_id, kind, name, date, minutes_taken, percentage) VALUES (?, 'mixed', 'Batiburrillo', ?, 30, 50)",
    )
    .run(id, `${daysAgo(2)}T10:00:00`);
  database
    .prepare(
      'INSERT INTO studied_topics (user_id, topic_id) SELECT ?, id FROM topics WHERE block_id = 2',
    )
    .run(id);
});

test('builds the streak, the last seven days and the blocks from real activity', async () => {
  const home = await (await request('/api/home', { cookie })).json();
  assert.equal(home.streakDays, 4);
  assert.deepEqual(
    home.lastSevenDays.map(({ hasStudied }: { hasStudied: boolean }) => hasStudied),
    [false, false, false, true, true, true, true],
  );
  assert.equal(home.lastSevenDays.at(-1).date, daysAgo(0));
  assert.deepEqual(home.studiedBlocks, [{ id: 2, name: 'Organización de oficinas públicas' }]);
  assert.deepEqual(home.weakBlocks, [
    {
      id: 1,
      name: 'Organización del Estado y de la Administración pública',
      correctPercentage: 50,
    },
  ]);
  assert.equal(home.studyStartDate, daysAgo(0));
});

test('needs a session', async () => {
  assert.equal((await request('/api/home')).status, 401);
});
