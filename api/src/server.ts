import { resolve } from 'node:path';
import { createApp } from './app.ts';
import { DB_FILE, openDatabase } from './database.ts';

const port = Number(process.env.PORT ?? 3000);

const database = openDatabase(DB_FILE);

const webDir = process.env.WEB_DIR ?? resolve(import.meta.dirname, '../../web/dist/web/browser');

createApp(database, webDir).listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);
