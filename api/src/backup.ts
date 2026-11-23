import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { backup, type DatabaseSync } from 'node:sqlite';

const PREFIX = 'opo-planner-';
const DAY_MS = 24 * 60 * 60 * 1000;

export const backupDatabase = async (
  database: DatabaseSync,
  dir: string,
  { keep = 30, now = new Date() }: { keep?: number; now?: Date } = {},
): Promise<string> => {
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${PREFIX}${now.toISOString().replace(/[:.]/g, '-')}.db`);
  await backup(database, file);
  const backups = (await readdir(dir))
    .filter((name) => name.startsWith(PREFIX) && name.endsWith('.db'))
    .sort();
  await Promise.all(backups.slice(0, -keep).map((name) => rm(join(dir, name))));
  return file;
};

export const backupUploads = (uploadsDir: string, dir: string): Promise<void> =>
  cp(uploadsDir, join(dir, 'uploads'), { recursive: true, force: false });

export const scheduleBackups = (database: DatabaseSync, dir: string, uploadsDir: string): void => {
  const run = () =>
    backupDatabase(database, dir)
      .then((file) => console.log(`Database backup saved to ${file}`))
      .then(() => backupUploads(uploadsDir, dir))
      .catch((error: unknown) => console.error('Database backup failed', error));
  run();
  setInterval(run, DAY_MS).unref();
};
