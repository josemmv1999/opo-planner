import type { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { authRoutes } from './auth/auth.routes.ts';

export const createApp = (database: DatabaseSync) => {
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(database));
  return app;
};
