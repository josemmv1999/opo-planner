import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, forkJoin, map, pipe, switchMap, tap } from 'rxjs';
import { QuizPhase, QuizQuestion } from '../../common/models/quiz.model';
import { ReviewQuestion, SyllabusTopicDetail } from '../../common/models/syllabus.model';
import { PlannerService } from '../services/planner.service';
import { QuizService } from '../services/quiz.service';
import { TopicResultsService } from '../services/topic-results.service';
import { SyllabusService } from '../services/syllabus.service';

export const QUESTION_COUNTS = [10, 20, 30] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

const GREAT_SHARE = 0.75;
const GOOD_SHARE = 0.5;

const NEW_ROUND = { phase: 'setup' as const, questions: [], answers: [], index: 0 };

interface TopicQuizState {
  topic: SyllabusTopicDetail | null;
  count: QuestionCount;
  questions: QuizQuestion[];
  answers: number[];
  index: number;
  phase: QuizPhase;
  isSetupModalOpen: boolean;
  isQuizModalOpen: boolean;
  isExitModalOpen: boolean;
  isLoadingTopic: boolean;
  isLoadingQuestions: boolean;
  startedAt: string | null;
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
    isSetupModalOpen: false,
    isQuizModalOpen: false,
    isExitModalOpen: false,
    isLoadingTopic: false,
    isLoadingQuestions: false,
    startedAt: null,
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
      open: rxMethod<number>(
        pipe(
          tap(() =>
            patchState(store, {
              ...NEW_ROUND,
              topic: null,
              isSetupModalOpen: true,
              isLoadingTopic: true,
              error: null,
            }),
          ),
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
      practise: rxMethod<{ topicId: number; questions: QuizQuestion[] }>(
        pipe(
          tap(() =>
            patchState(store, { ...NEW_ROUND, topic: null, isLoadingTopic: true, error: null }),
          ),
          switchMap(({ topicId, questions }) =>
            syllabusService.getTopic(topicId).pipe(
              tapResponse({
                next: (topic) =>
                  patchState(store, {
                    topic,
                    questions,
                    count: questions.length as QuestionCount,
                    phase: 'playing',
                    startedAt: new Date().toISOString(),
                    isSetupModalOpen: false,
                    isQuizModalOpen: true,
                    isLoadingTopic: false,
                  }),
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
                    phase: 'playing',
                    startedAt: new Date().toISOString(),
                    isSetupModalOpen: false,
                    isQuizModalOpen: true,
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
      closeSetupModal(): void {
        patchState(store, { isSetupModalOpen: false });
      },
      restart(): void {
        patchState(store, { ...NEW_ROUND, isQuizModalOpen: false, isSetupModalOpen: true });
      },
      requestClose(): void {
        patchState(
          store,
          store.phase() === 'playing'
            ? { isExitModalOpen: true }
            : { ...NEW_ROUND, isQuizModalOpen: false },
        );
      },
      exit(): void {
        patchState(store, { ...NEW_ROUND, isExitModalOpen: false, isQuizModalOpen: false });
      },
      closeExitModal(): void {
        patchState(store, { isExitModalOpen: false });
      },
    }),
  ),
  withHooks(
    (
      store,
      plannerService = inject(PlannerService),
      topicResultsService = inject(TopicResultsService),
    ) => ({
      onInit(): void {
        rxMethod<QuizPhase>(
          pipe(
            filter((phase) => phase === 'finished'),
            map(() => ({ topic: store.topic(), start: store.startedAt() })),
            filter(
              (round): round is { topic: SyllabusTopicDetail; start: string } =>
                round.topic !== null && round.start !== null,
            ),
            switchMap(({ topic, start }) => {
              const end = new Date().toISOString();
              const mistakes = store
                .questions()
                .map<ReviewQuestion | null>((question, i) => {
                  const chosenOption = store.answers()[i];
                  return chosenOption === question.correctOption
                    ? null
                    : {
                        questionId: question.id,
                        statement: question.statement,
                        options: question.options,
                        chosenOption,
                        correctOption: question.correctOption,
                        reasoning: question.reasoning,
                      };
                })
                .filter((mistake): mistake is ReviewQuestion => mistake !== null);
              return forkJoin([
                plannerService.logRecord({
                  kind: 'quiz',
                  name: `Tema ${topic.number}`,
                  percentage: store.percentage(),
                  start,
                  end,
                }),
                topicResultsService.saveResult({
                  topicId: topic.id,
                  date: end,
                  percentage: store.percentage(),
                  mistakes,
                  correctQuestionIds: store
                    .questions()
                    .filter((question, i) => store.answers()[i] === question.correctOption)
                    .map(({ id }) => id),
                }),
              ]).pipe(tapResponse({ next: () => undefined, error: () => undefined }));
            }),
          ),
        )(store.phase);
      },
    }),
  ),
);
