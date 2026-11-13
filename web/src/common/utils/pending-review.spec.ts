import { describe, expect, it } from 'vitest';
import { ReviewQuestion, TopicResult } from '../models/syllabus.model';
import { pendingReview, toQuizQuestion } from './pending-review';

const mistake = (questionId: number): ReviewQuestion => ({
  questionId,
  statement: `Question ${questionId}`,
  options: ['A', 'B'],
  chosenOption: 0,
  correctOption: 1,
  reasoning: 'Because',
});

const result = (
  id: number,
  date: string,
  mistakes: ReviewQuestion[],
  correctQuestionIds: number[] = [],
): TopicResult => ({
  id,
  topicId: 1,
  date,
  percentage: 50,
  mistakes,
  correctQuestionIds,
  isReview: false,
});

describe('pendingReview', () => {
  it('keeps the latest mistake of each question and drops the ones answered right later', () => {
    const pending = pendingReview([
      result(1, '2026-11-01', [mistake(1), mistake(2), mistake(3)]),
      result(2, '2026-11-05', [mistake(2)], [1]),
    ]);
    expect(pending.map(({ questionId }) => questionId)).toEqual([2, 3]);
  });

  it('turns a review question into a quiz question', () => {
    expect(toQuizQuestion(mistake(4))).toEqual({
      id: 4,
      caseText: null,
      statement: 'Question 4',
      options: ['A', 'B'],
      correctOption: 1,
      reasoning: 'Because',
    });
  });
});
