import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createApp } from './app.ts';
import { openDatabase } from './database.ts';

let server: Server;
let baseUrl: string;

before(() => {
  const webDir = mkdtempSync(join(tmpdir(), 'opo-web-'));
  writeFileSync(join(webDir, 'index.html'), '<app-root></app-root>');
  writeFileSync(join(webDir, 'main.js'), 'console.log(1);');
  server = createApp(openDatabase(':memory:'), webDir).listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

test('serves the web files and falls back to index.html for app routes', async () => {
  assert.equal(await (await fetch(`${baseUrl}/main.js`)).text(), 'console.log(1);');
  assert.equal(await (await fetch(`${baseUrl}/planner`)).text(), '<app-root></app-root>');
});

test('keeps unknown API routes as 404', async () => {
  assert.equal((await fetch(`${baseUrl}/api/unknown`)).status, 404);
});
