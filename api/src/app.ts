import express from 'express';

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  return app;
};
