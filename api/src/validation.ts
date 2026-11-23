export const isFilled = (...values: unknown[]): boolean =>
  values.every((value) => typeof value === 'string' && value.trim() !== '');
