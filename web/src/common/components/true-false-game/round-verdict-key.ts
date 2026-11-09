const GOOD_ROUND_SHARE = 0.6;

export const roundVerdictKey = (correctCount: number, total: number): string => {
  if (correctCount === total) return 'trueFalseGame.verdict.perfect';
  return correctCount >= total * GOOD_ROUND_SHARE
    ? 'trueFalseGame.verdict.good'
    : 'trueFalseGame.verdict.review';
};
