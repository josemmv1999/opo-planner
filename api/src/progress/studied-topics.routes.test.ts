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

const put = (body: unknown, as = cookie) =>
  request('/api/studied-topics', { method: 'PUT', cookie: as, body: JSON.stringify(body) });

test('marks and unmarks topics as studied for each user', async () => {
  assert.deepEqual(await (await put({ topicIds: [3, 1, 2], isStudied: true })).json(), [1, 2, 3]);
  assert.deepEqual(await (await put({ topicIds: [2], isStudied: false })).json(), [1, 3]);
  assert.deepEqual(await (await request('/api/studied-topics', { cookie })).json(), [1, 3]);
  assert.deepEqual(await (await request('/api/studied-topics', { cookie: other })).json(), []);
});

test('rejects invalid bodies and unknown topics', async () => {
  assert.equal((await put({ topicIds: [], isStudied: true })).status, 400);
  assert.equal((await put({ topicIds: [1], isStudied: 'yes' })).status, 400);
  assert.equal((await put({ topicIds: [9999], isStudied: true })).status, 400);
});

test('needs a session', async () => {
  assert.equal((await request('/api/studied-topics')).status, 401);
});
