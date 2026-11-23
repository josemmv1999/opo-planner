import { createApp } from './app.ts';
import { openDatabase } from './database.ts';

const port = Number(process.env.PORT ?? 3000);

const database = openDatabase(process.env.DB_FILE ?? 'data/opo-planner.db');

createApp(database).listen(port, () => console.log(`API listening on http://localhost:${port}`));
