import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { accountRoutes } from './auth/account.routes.ts';
import { authRoutes } from './auth/auth.routes.ts';
import { adminExamsRoutes } from './exams/admin-exams.routes.ts';
import { adminQuestionsRoutes } from './exams/admin-questions.routes.ts';
import { examAttemptsRoutes } from './exams/exam-attempts.routes.ts';
import { examsRoutes } from './exams/exams.routes.ts';
import { studiedTopicsRoutes } from './progress/studied-topics.routes.ts';
import { topicResultsRoutes } from './progress/topic-results.routes.ts';
import { syllabusRoutes } from './syllabus/syllabus.routes.ts';
import { questionsRoutes } from './exams/questions.routes.ts';
import { UPLOADS_DIR } from './database.ts';
import { annotationsRoutes } from './notes/annotations.routes.ts';
import { notesRoutes } from './notes/notes.routes.ts';

export const createApp = (database: DatabaseSync, webDir?: string, uploadsDir = UPLOADS_DIR) => {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(database));
  app.use('/api/account', accountRoutes(database));
  app.use('/api/admin/exams', adminExamsRoutes(database));
  app.use('/api/admin/questions', adminQuestionsRoutes(database));
  app.use('/api/exams', examsRoutes(database));
  app.use('/api/exam-attempts', examAttemptsRoutes(database));
  app.use('/api/syllabus', syllabusRoutes(database));
  app.use('/api/questions', questionsRoutes(database));
  app.use('/api/topic-results', topicResultsRoutes(database));
  app.use('/api/studied-topics', studiedTopicsRoutes(database));
  app.use('/api/notes/:noteId/annotations', annotationsRoutes(database));
  app.use('/api/notes', notesRoutes(database, uploadsDir));
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
