import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

let admin: string;
let user: string;

before(async () => {
  admin = await signUp('admin@example.com', { isAdmin: true });
  user = await signUp('ana@example.com');
});

const upload = (cookie: string, name = 'Tema 1.pdf', type = 'application/pdf') =>
  request(`/api/admin/materials/file?topicId=3&name=${encodeURIComponent(name)}`, {
    method: 'POST',
    cookie,
    body: Buffer.from('%PDF-1.4 temario'),
    headers: { 'Content-Type': type },
  });

test('only admins can upload and delete materials', async () => {
  assert.equal((await upload('')).status, 401);
  assert.equal((await upload(user)).status, 403);
  assert.equal(
    (await request('/api/admin/materials/1', { method: 'DELETE', cookie: user })).status,
    403,
  );
});

test('every user lists and downloads the materials of a topic', async () => {
  const created = await (await upload(admin)).json();
  assert.equal(created.title, 'Tema 1');
  assert.equal(created.topicId, 3);

  const list = await (await request('/api/materials?topicId=3', { cookie: user })).json();
  assert.deepEqual(
    list.map(({ id }: { id: number }) => id),
    [created.id],
  );
  assert.deepEqual(await (await request('/api/materials?topicId=4', { cookie: user })).json(), []);

  const detail = await (await request(`/api/materials/${created.id}`, { cookie: user })).json();
  assert.equal(detail.fileUrl, `/api/materials/${created.id}/file`);

  const file = await request(detail.fileUrl, { cookie: user });
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  assert.equal(await file.text(), '%PDF-1.4 temario');
});

test('rejects files that are not PDFs and unknown topics', async () => {
  assert.equal((await upload(admin, 'a.png', 'image/png')).status, 400);
  const response = await request('/api/admin/materials/file?topicId=9999&name=a.pdf', {
    method: 'POST',
    cookie: admin,
    body: Buffer.from('%PDF'),
    headers: { 'Content-Type': 'application/pdf' },
  });
  assert.equal(response.status, 400);
});

test('deletes a material and its file', async () => {
  const { id, fileUrl } = await (await upload(admin)).json();
  assert.equal(
    (await request(`/api/admin/materials/${id}`, { method: 'DELETE', cookie: admin })).status,
    204,
  );
  assert.equal((await request(fileUrl, { cookie: user })).status, 404);
  assert.equal(
    (await request(`/api/admin/materials/${id}`, { method: 'DELETE', cookie: admin })).status,
    404,
  );
});
