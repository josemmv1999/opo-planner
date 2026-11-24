import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

const put = (path: string, cookie: string, body: object) =>
  request(`/api/account${path}`, { method: 'PUT', cookie, body: JSON.stringify(body) });

const me = async (cookie: string) => (await request('/api/auth/me', { cookie })).json();

test('completes the onboarding', async () => {
  const cookie = await signUp('ana@example.com');
  assert.equal((await request('/api/account/onboarding', { method: 'POST', cookie })).status, 204);
  assert.equal((await me(cookie)).hasCompletedOnboarding, true);
});

test('updates the profile unless the email belongs to someone else', async () => {
  const cookie = await signUp('luis@example.com');
  await signUp('taken@example.com');
  const profile = { name: 'Luis', surname: 'Pérez', email: 'luis.perez@example.com' };
  const response = await put('/profile', cookie, profile);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).email, profile.email);
  assert.equal(
    (await put('/profile', cookie, { ...profile, email: 'taken@example.com' })).status,
    409,
  );
  assert.equal((await put('/profile', cookie, { ...profile, name: '' })).status, 400);
});

test('changes the password only with the current one', async () => {
  const cookie = await signUp('eva@example.com');
  assert.equal(
    (await put('/password', cookie, { currentPassword: 'wrong', newPassword: 'new123' })).status,
    403,
  );
  assert.equal(
    (await put('/password', cookie, { currentPassword: 'secret123', newPassword: 'new123' }))
      .status,
    204,
  );
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'eva@example.com', password: 'new123' }),
  });
  assert.equal(login.status, 200);
});

test('saves the chosen oppositions and the active one', async () => {
  const cookie = await signUp('opos@example.com');
  const put = (path: string, body: unknown) =>
    request(`/api/account/oppositions${path}`, {
      method: 'PUT',
      cookie,
      body: JSON.stringify(body),
    });
  assert.deepEqual(await (await request('/api/account/oppositions', { cookie })).json(), {
    ids: null,
    activeId: null,
  });
  await put('', { ids: ['age-c1', 'age-c2', 'age-c1'] });
  await put('/active', { id: 'age-c1' });
  assert.deepEqual(await (await request('/api/account/oppositions', { cookie })).json(), {
    ids: ['age-c1', 'age-c2'],
    activeId: 'age-c1',
  });
  assert.equal((await put('', { ids: [] })).status, 400);
  assert.equal((await put('/active', { id: '' })).status, 400);
});
