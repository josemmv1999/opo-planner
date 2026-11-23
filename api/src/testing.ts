import { mkdtempSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { after } from 'node:test';
import { createApp } from './app.ts';
import { makeAdmin } from './auth/make-admin.ts';
import { openDatabase } from './database.ts';

export interface TestServer {
  database: DatabaseSync;
  request: (path: string, init?: RequestInit & { cookie?: string }) => Promise<Response>;
  signUp: (email: string, options?: { isAdmin?: boolean }) => Promise<string>;
}

export const startTestServer = (): TestServer => {
  const database = openDatabase(':memory:');
  const server = createApp(database, undefined, mkdtempSync(join(tmpdir(), 'opo-uploads-'))).listen(
    0,
  );
  after(() => server.close());
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  const request: TestServer['request'] = (path, { cookie, body, headers, ...init } = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      body,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string>),
        ...(cookie ? { cookie } : {}),
      },
    });

  const signUp: TestServer['signUp'] = async (email, { isAdmin = false } = {}) => {
    const body = JSON.stringify({ name: 'Test', surname: 'User', email, password: 'secret123' });
    const response = await request('/api/auth/register', { method: 'POST', body });
    if (isAdmin) makeAdmin(database, email);
    return (response.headers.get('set-cookie') ?? '').split(';')[0];
  };

  return { database, request, signUp };
};
