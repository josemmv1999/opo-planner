import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
import { QuizPhase, QuizQuestion } from '../../common/models/quiz.model';
import { SyllabusTopicDetail } from '../../common/models/syllabus.model';
import { QuizService } from '../services/quiz.service';
import { SyllabusService } from '../services/syllabus.service';

export const QUESTION_COUNTS = [10, 20, 30] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

const GREAT_SHARE = 0.75;
const GOOD_SHARE = 0.5;

interface TopicQuizState {
  topic: SyllabusTopicDetail | null;
  count: QuestionCount;
  questions: QuizQuestion[];
  answers: number[];
  index: number;
  phase: QuizPhase;
  isExitModalOpen: boolean;
  isLoadingTopic: boolean;
  isLoadingQuestions: boolean;
  error: 'loading' | null;
}

export const TopicQuizStore = signalStore(
  withState<TopicQuizState>({
    topic: null,
    count: 20,
    questions: [],
    answers: [],
    index: 0,
    phase: 'setup',
    isExitModalOpen: false,
    isLoadingTopic: false,
    isLoadingQuestions: false,
    error: null,
  }),
  withComputed(({ questions, answers, index }) => {
    const currentQuestion = computed(() => questions()[index()] ?? null);
    const currentAnswer = computed(() => answers()[index()] ?? null);
    const results = computed(() =>
      answers().map((answer, i) => answer === questions()[i]?.correctOption),
    );
    const correctCount = computed(() => results().filter(Boolean).length);
    const percentage = computed(() =>
      questions().length ? Math.round((correctCount() / questions().length) * 100) : 0,
    );
    return {
      currentQuestion,
      currentAnswer,
      isAnswered: computed(() => currentAnswer() !== null),
      isCorrect: computed(
        () => currentAnswer() !== null && currentAnswer() === currentQuestion()?.correctOption,
      ),
      isLastQuestion: computed(() => index() === questions().length - 1),
      correctCount,
      wrongCount: computed(() => results().length - correctCount()),
      percentage,
      verdictKey: computed(() => {
        const share = percentage() / 100;
        if (share >= GREAT_SHARE) return 'topicQuiz.verdict.great';
        return share >= GOOD_SHARE ? 'topicQuiz.verdict.good' : 'topicQuiz.verdict.review';
      }),
      wrongQuestions: computed(() => questions().filter((_, i) => results()[i] === false)),
    };
  }),
  withMethods(
    (store, syllabusService = inject(SyllabusService), quizService = inject(QuizService)) => ({
      loadTopic: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoadingTopic: true, error: null })),
          switchMap((topicId) =>
            syllabusService.getTopic(topicId).pipe(
              tapResponse({
                next: (topic) => patchState(store, { topic, isLoadingTopic: false }),
                error: () => patchState(store, { isLoadingTopic: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      start: rxMethod<void>(
        pipe(
          map(() => store.topic()),
          filter((topic): topic is SyllabusTopicDetail => topic !== null),
          tap(() => patchState(store, { isLoadingQuestions: true, error: null })),
          switchMap((topic) =>
            quizService.getTopicQuestions(topic.id, store.count()).pipe(
              tapResponse({
                next: (questions) =>
                  patchState(store, {
                    questions,
                    answers: [],
                    index: 0,
                    phase: 'playing',
                    isLoadingQuestions: false,
                  }),
                error: () => patchState(store, { isLoadingQuestions: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      setCount(count: QuestionCount): void {
        patchState(store, { count });
      },
      answer(option: number): void {
        if (store.isAnswered()) return;
        patchState(store, ({ answers }) => ({ answers: [...answers, option] }));
      },
      next(): void {
        if (!store.isAnswered()) return;
        patchState(store, ({ index }) =>
          store.isLastQuestion() ? { phase: 'finished' as const } : { index: index + 1 },
        );
      },
      restart(): void {
        patchState(store, { phase: 'setup', questions: [], answers: [], index: 0 });
      },
      openExitModal(): void {
        patchState(store, { isExitModalOpen: true });
      },
      closeExitModal(): void {
        patchState(store, { isExitModalOpen: false });
      },
    }),
  ),
);
