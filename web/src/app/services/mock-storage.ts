import { readStorage, writeStorage } from '../../common/utils/storage';

export const MOCK_ONBOARDING_KEY = 'mockHasCompletedOnboarding';
export const MOCK_OPPOSITION_IDS_KEY = 'mockOppositionIds';
export const MOCK_ACTIVE_OPPOSITION_KEY = 'mockActiveOppositionId';

export const readMockFlag = (key: string): boolean => readStorage(key) === 'true';

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

const EXAM_DATE_KEY = 'mockExamDate';
const DEFAULT_EXAM_DATE = '2027-06-12';

export const readExamDate = (): string => readJson<string>(EXAM_DATE_KEY) ?? DEFAULT_EXAM_DATE;

export const writeExamDate = (date: string): void => writeJson(EXAM_DATE_KEY, date);
