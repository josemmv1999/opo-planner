import { createApp } from './app.ts';
import { openDatabase } from './database.ts';

const port = Number(process.env.PORT ?? 3000);

openDatabase(process.env.DB_FILE ?? 'data/opo-planner.db');

createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));
