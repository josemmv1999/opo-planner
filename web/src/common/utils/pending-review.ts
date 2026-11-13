import { QuizQuestion } from '../models/quiz.model';
import { ReviewQuestion, TopicResult } from '../models/syllabus.model';

export const pendingReview = (results: TopicResult[]): ReviewQuestion[] => {
  const settled = new Set<number>();
  return [...results]
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap(({ mistakes, correctQuestionIds }) => {
      const pending = mistakes.filter(({ questionId }) => !settled.has(questionId));
      [...pending.map(({ questionId }) => questionId), ...correctQuestionIds].forEach((id) =>
        settled.add(id),
      );
      return pending;
    });
};

export const toQuizQuestion = ({
  questionId,
  statement,
  options,
  correctOption,
  reasoning,
}: ReviewQuestion): QuizQuestion => ({
  id: questionId,
  caseText: null,
  statement,
  options,
  correctOption,
  reasoning,
});
