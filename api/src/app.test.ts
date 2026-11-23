import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import { createApp } from './app.ts';
import { openDatabase } from './database.ts';

let server: Server;
let baseUrl: string;

before(() => {
  server = createApp(openDatabase(':memory:')).listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

test('GET /api/health answers ok', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
