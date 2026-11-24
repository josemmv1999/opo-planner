import { readStorage, writeStorage } from '../../common/utils/storage';

export const MOCK_OPPOSITION_IDS_KEY = 'mockOppositionIds';
export const MOCK_ACTIVE_OPPOSITION_KEY = 'mockActiveOppositionId';

export const readJson = <T>(key: string): T | null => {
  try {
    const value = readStorage(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export const writeJson = (key: string, value: unknown): void =>
  writeStorage(key, JSON.stringify(value));

export const DEFAULT_EXAM_DATE = '2027-06-12';
