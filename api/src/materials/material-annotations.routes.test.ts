import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

let ana: string;
let luis: string;
let base: string;

before(async () => {
  const admin = await signUp('admin@example.com', { isAdmin: true });
  ana = await signUp('ana@example.com');
  luis = await signUp('luis@example.com');
  const material = await (
    await request('/api/admin/materials/file?topicId=1&name=Tema.pdf', {
      method: 'POST',
      cookie: admin,
      body: Buffer.from('%PDF'),
      headers: { 'Content-Type': 'application/pdf' },
    })
  ).json();
  base = `/api/materials/${material.id}/annotations`;
});

const post = (cookie: string, body: unknown) =>
  request(base, { method: 'POST', cookie, body: JSON.stringify(body) });

const highlight = {
  kind: 'highlight',
  page: 2,
  text: 'texto',
  rects: [{ x: 10, y: 20, width: 30, height: 2 }],
  color: 'green',
  comment: 'Ojo al plazo',
};

test('each user only sees their own annotations on a shared material', async () => {
  const created = await (await post(ana, highlight)).json();
  assert.deepEqual(created.rects, highlight.rects);
  await post(luis, { kind: 'margin', page: 1, y: 40, side: 'left', color: 'yellow' });

  const anaList = await (await request(base, { cookie: ana })).json();
  assert.deepEqual(
    anaList.map(({ kind }: { kind: string }) => kind),
    ['highlight'],
  );
  const luisList = await (await request(base, { cookie: luis })).json();
  assert.deepEqual(
    luisList.map(({ kind }: { kind: string }) => kind),
    ['margin'],
  );
});

test('updates and deletes only the owner annotations', async () => {
  const { id } = await (await post(ana, highlight)).json();
  const url = `${base}/${id}`;
  const body = JSON.stringify({ color: 'blue', comment: 'Repasar' });

  assert.equal((await request(url, { method: 'PUT', cookie: luis, body })).status, 404);
  const updated = await (await request(url, { method: 'PUT', cookie: ana, body })).json();
  assert.deepEqual([updated.color, updated.comment], ['blue', 'Repasar']);

  assert.equal((await request(url, { method: 'DELETE', cookie: luis })).status, 404);
  assert.equal((await request(url, { method: 'DELETE', cookie: ana })).status, 204);
});

test('rejects invalid annotations and unknown materials', async () => {
  assert.equal((await post(ana, { ...highlight, color: 'red' })).status, 400);
  assert.equal((await request('/api/materials/9999/annotations', { cookie: ana })).status, 404);
  assert.equal((await request(base)).status, 401);
});
