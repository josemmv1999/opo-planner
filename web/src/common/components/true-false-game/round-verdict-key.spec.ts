import { describe, expect, it } from 'vitest';
import { roundVerdictKey } from './round-verdict-key';

describe('roundVerdictKey', () => {
  it('is perfect when every answer is right', () => {
    expect(roundVerdictKey(5, 5)).toBe('trueFalseGame.verdict.perfect');
    expect(roundVerdictKey(3, 3)).toBe('trueFalseGame.verdict.perfect');
  });

  it('is good from 60 % of right answers', () => {
    expect(roundVerdictKey(3, 5)).toBe('trueFalseGame.verdict.good');
    expect(roundVerdictKey(4, 5)).toBe('trueFalseGame.verdict.good');
  });

  it('asks to review below 60 %', () => {
    expect(roundVerdictKey(2, 5)).toBe('trueFalseGame.verdict.review');
    expect(roundVerdictKey(0, 5)).toBe('trueFalseGame.verdict.review');
  });
});
