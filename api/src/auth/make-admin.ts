import type { DatabaseSync } from 'node:sqlite';

export const makeAdmin = (database: DatabaseSync, email: string): boolean =>
  database.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email).changes > 0;
