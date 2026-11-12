import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, filter, forkJoin, from, map, pipe, switchMap, tap } from 'rxjs';
import { QuizQuestion } from '../../common/models/quiz.model';
import {
  ReviewQuestion,
  SyllabusTopicDetail,
  TopicResult,
} from '../../common/models/syllabus.model';
import { NotesService } from '../services/notes.service';
import { SyllabusService } from '../services/syllabus.service';
import { TopicResultsService } from '../services/topic-results.service';

const TREND_LENGTH = 5;
const REVIEW_LENGTH = 3;

interface SyllabusTopicState {
  topic: SyllabusTopicDetail | null;
  results: TopicResult[];
  isLoading: boolean;
  isUploading: boolean;
  error: 'loading' | 'uploading' | null;
}

export const SyllabusTopicStore = signalStore(
  withState<SyllabusTopicState>({
    topic: null,
    results: [],
    isLoading: false,
    isUploading: false,
    error: null,
  }),
  withComputed(({ results }) => {
    const sortedResults = computed(() =>
      [...results()].sort((a, b) => a.date.localeCompare(b.date)),
    );
    const pendingReview = computed(() => {
      const settled = new Set<number>();
      return [...sortedResults()].reverse().flatMap(({ mistakes, correctQuestionIds }) => {
        const pending = mistakes.filter(({ questionId }) => !settled.has(questionId));
        [...pending.map(({ questionId }) => questionId), ...correctQuestionIds].forEach((id) =>
          settled.add(id),
        );
        return pending;
      });
    });
    const quizResults = computed(() => sortedResults().filter(({ isReview }) => !isReview));
    return {
      trend: computed(() => quizResults().slice(-TREND_LENGTH)),
      improvement: computed(() => {
        const sorted = quizResults();
        return sorted.length > 1
          ? sorted[sorted.length - 1].percentage - sorted[0].percentage
          : null;
      }),
      reviewQuestions: computed<ReviewQuestion[]>(() => pendingReview().slice(0, REVIEW_LENGTH)),
      reviewCount: computed(() => pendingReview().length),
      reviewQuiz: computed<QuizQuestion[]>(() =>
        pendingReview().map(({ questionId, statement, options, correctOption, reasoning }) => ({
          id: questionId,
          caseText: null,
          statement,
          options,
          correctOption,
          reasoning,
        })),
      ),
    };
  }),
  withMethods(
    (
      store,
      syllabusService = inject(SyllabusService),
      notesService = inject(NotesService),
      topicResultsService = inject(TopicResultsService),
    ) => ({
      load: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((topicId) =>
            forkJoin({
              topic: syllabusService.getTopic(topicId),
              results: topicResultsService.getTopicResults(topicId),
            }).pipe(
              tapResponse({
                next: ({ topic, results }) =>
                  patchState(store, { topic, results, isLoading: false }),
                error: () => patchState(store, { topic: null, isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      uploadFiles: rxMethod<File[]>(
        pipe(
          map((files) => ({ files, topicId: store.topic()?.id })),
          filter(
            (upload): upload is { files: File[]; topicId: number } =>
              upload.topicId !== undefined && upload.files.length > 0,
          ),
          tap(() => patchState(store, { isUploading: true, error: null })),
          switchMap(({ files, topicId }) =>
            from(files).pipe(
              concatMap((file) => notesService.uploadFile(topicId, file)),
              tapResponse({
                next: (note) =>
                  patchState(store, ({ topic }) => ({
                    topic: topic && { ...topic, notes: [...topic.notes, note] },
                  })),
                error: () => patchState(store, { isUploading: false, error: 'uploading' }),
                finalize: () => patchState(store, { isUploading: false }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
