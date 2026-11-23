import { join, resolve } from 'node:path';
import { createApp } from './app.ts';
import { scheduleBackups } from './backup.ts';
import { DB_FILE, UPLOADS_DIR, openDatabase } from './database.ts';

const port = Number(process.env.PORT ?? 3000);

const database = openDatabase(DB_FILE);

const backupDir =
  process.env.BACKUP_DIR ??
  (process.env.OneDrive && join(process.env.OneDrive, 'opo-planner', 'backups'));

if (backupDir) scheduleBackups(database, backupDir, UPLOADS_DIR);

const webDir = process.env.WEB_DIR ?? resolve(import.meta.dirname, '../../web/dist/web/browser');

createApp(database, webDir).listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);
