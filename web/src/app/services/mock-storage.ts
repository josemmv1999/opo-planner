export const MOCK_ONBOARDING_KEY = 'mockHasCompletedOnboarding';
export const INTERFACE_MODE_KEY = 'interfaceMode';

export const readMockFlag = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};
