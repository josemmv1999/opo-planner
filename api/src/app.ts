import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { authRoutes } from './auth/auth.routes.ts';

export const createApp = (database: DatabaseSync, webDir?: string) => {
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(database));
  if (webDir) {
    app.use(express.static(webDir));
    app.use((req, res, next) =>
      req.method === 'GET' && !req.path.startsWith('/api/')
        ? res.sendFile(join(webDir, 'index.html'))
        : next(),
    );
  }
  return app;
};
