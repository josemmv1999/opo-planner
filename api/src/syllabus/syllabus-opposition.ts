import type { DatabaseSync } from 'node:sqlite';
import { FUENGIROLA_ID } from './syllabus-seed.ts';

const DEFAULT_ID = 'age-c1';

export const syllabusOppositionOf = (database: DatabaseSync) => {
  const findUser = database.prepare(
    'SELECT opposition_ids, active_opposition_id FROM users WHERE id = ?',
  );
  return (userId: number): string => {
    const { opposition_ids, active_opposition_id } = findUser.get(userId) as {
      opposition_ids: string | null;
      active_opposition_id: string | null;
    };
    const ids = opposition_ids ? (JSON.parse(opposition_ids) as string[]) : [];
    const activeId =
      active_opposition_id && ids.includes(active_opposition_id) ? active_opposition_id : ids[0];
    return activeId === FUENGIROLA_ID ? FUENGIROLA_ID : DEFAULT_ID;
  };
};
