import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { createApp } from '../app.ts';
import { openDatabase } from '../database.ts';

let server: Server;
let baseUrl: string;

const post = (path: string, body: object): Promise<Response> =>
  fetch(`${baseUrl}/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const ana = { name: 'Ana', surname: 'López', email: 'ana@example.com', password: 'secret123' };

before(() => {
  server = createApp(openDatabase(':memory:')).listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

test('registers a user and starts a session', async () => {
  const response = await post('/register', ana);
  assert.equal(response.status, 201);
  assert.match(response.headers.get('set-cookie') ?? '', /^session=\w+;.*HttpOnly/);
  assert.deepEqual(await response.json(), {
    name: 'Ana',
    surname: 'López',
    email: 'ana@example.com',
    hasCompletedOnboarding: false,
    isAdmin: false,
  });
});

test('rejects a repeated email and missing fields', async () => {
  assert.equal((await post('/register', { ...ana, email: 'ANA@example.com' })).status, 409);
  assert.equal((await post('/register', { ...ana, name: ' ' })).status, 400);
});

test('logs in only with the right password', async () => {
  const response = await post('/login', { email: ana.email, password: ana.password });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('set-cookie'));
  assert.equal((await post('/login', { email: ana.email, password: 'wrong' })).status, 401);
  assert.equal((await post('/login', { email: 'nobody@example.com', password: 'x' })).status, 401);
});
