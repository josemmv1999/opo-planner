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

const json = (body: unknown) => JSON.stringify(body);

test('creates, edits and lists text notes of a topic', async () => {
  const created = await (
    await request('/api/notes', {
      method: 'POST',
      cookie,
      body: json({ topicId: 1, title: 'Resumen', content: '<h2>Título</h2><p>Texto largo</p>' }),
    })
  ).json();
  assert.equal(created.kind, 'text');
  assert.equal(created.fileUrl, null);

  const updated = await (
    await request(`/api/notes/${created.id}`, {
      method: 'PUT',
      cookie,
      body: json({ title: 'Resumen 2', content: '<p>Nuevo</p>' }),
    })
  ).json();
  assert.equal(updated.title, 'Resumen 2');

  const list = await (await request('/api/notes?topicId=1', { cookie })).json();
  assert.deepEqual(
    list.map(({ title, preview }: { title: string; preview: string }) => [title, preview]),
    [['Resumen 2', 'Nuevo']],
  );
  assert.deepEqual(await (await request('/api/notes?topicId=1', { cookie: other })).json(), []);
});

test('uploads a file, serves it and deletes it', async () => {
  const upload = await request('/api/notes/file?topicId=2&name=Tema%201.pdf', {
    method: 'POST',
    cookie,
    body: Buffer.from('%PDF-1.4 test'),
    headers: { 'Content-Type': 'application/pdf' },
  });
  assert.equal(upload.status, 201);
  const note = await upload.json();
  assert.equal(note.title, 'Tema 1');
  assert.equal(note.kind, 'pdf');

  const file = await request(note.preview, { cookie });
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  assert.equal(await file.text(), '%PDF-1.4 test');
  assert.equal((await request(note.preview, { cookie: other })).status, 404);

  assert.deepEqual(await (await request('/api/notes/counts', { cookie })).json(), {
    1: 1,
    2: 1,
  });

  assert.equal((await request(`/api/notes/${note.id}`, { method: 'DELETE', cookie })).status, 204);
  assert.equal((await request(note.preview, { cookie })).status, 404);
});

test('rejects files that are not PDFs or images', async () => {
  const response = await request('/api/notes/file?topicId=2&name=a.zip', {
    method: 'POST',
    cookie,
    body: Buffer.from('zip'),
    headers: { 'Content-Type': 'application/zip' },
  });
  assert.equal(response.status, 400);
});

test('needs a session', async () => {
  assert.equal((await request('/api/notes?topicId=1')).status, 401);
});
