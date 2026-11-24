import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

let cookie: string;
let other: string;
let base: string;

before(async () => {
  cookie = await signUp('ana@example.com');
  other = await signUp('luis@example.com');
  const note = await (
    await request('/api/notes/file?topicId=1&name=Tema.pdf', {
      method: 'POST',
      cookie,
      body: Buffer.from('%PDF'),
      headers: { 'Content-Type': 'application/pdf' },
    })
  ).json();
  base = `/api/notes/${note.id}/annotations`;
});

const post = (body: unknown) =>
  request(base, { method: 'POST', cookie, body: JSON.stringify(body) });

test('adds highlights and margin notes and lists them by page', async () => {
  const highlight = await (
    await post({
      kind: 'highlight',
      page: 2,
      text: 'texto',
      rects: [{ x: 10, y: 20, width: 30, height: 2 }],
      color: 'green',
      comment: 'Ojo al plazo',
    })
  ).json();
  assert.equal(highlight.color, 'green');
  assert.deepEqual(highlight.rects, [{ x: 10, y: 20, width: 30, height: 2 }]);

  const margin = await (
    await post({
      kind: 'margin',
      page: 1,
      y: 40,
      side: 'left',
      color: 'yellow',
      comment: 'Resumen',
    })
  ).json();
  assert.deepEqual([margin.side, margin.y], ['left', 40]);

  const list = await (await request(base, { cookie })).json();
  assert.deepEqual(
    list.map(({ kind }: { kind: string }) => kind),
    ['margin', 'highlight'],
  );
});

test('changes the color and the comment, and deletes', async () => {
  const { id } = await (
    await post({ kind: 'margin', page: 3, y: 10, side: 'right', color: 'blue' })
  ).json();
  const updated = await (
    await request(`${base}/${id}`, {
      method: 'PUT',
      cookie,
      body: JSON.stringify({ color: 'pink', comment: 'Nueva' }),
    })
  ).json();
  assert.deepEqual([updated.color, updated.comment], ['pink', 'Nueva']);
  const put = (body: unknown) =>
    request(`${base}/${id}`, { method: 'PUT', cookie, body: JSON.stringify(body) });
  const moved = await (await put({ y: 72.5, side: 'left' })).json();
  assert.deepEqual([moved.y, moved.side, moved.comment], [72.5, 'left', 'Nueva']);
  assert.equal((await put({ y: 120 })).status, 400);
  assert.equal((await put({ side: 'top' })).status, 400);
  assert.equal((await request(`${base}/${id}`, { method: 'DELETE', cookie })).status, 204);
  assert.equal((await request(`${base}/${id}`, { method: 'DELETE', cookie })).status, 404);
});

test('rejects invalid annotations and other users', async () => {
  assert.equal(
    (await post({ kind: 'margin', page: 1, y: 150, side: 'left', color: 'yellow' })).status,
    400,
  );
  assert.equal(
    (await post({ kind: 'highlight', page: 1, text: 'x', rects: [], color: 'yellow' })).status,
    400,
  );
  assert.equal(
    (await post({ kind: 'margin', page: 1, y: 5, side: 'left', color: 'black' })).status,
    400,
  );
  assert.equal((await request(base, { cookie: other })).status, 404);
});
