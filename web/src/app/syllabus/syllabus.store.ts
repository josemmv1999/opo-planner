import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, forkJoin, pipe, switchMap, tap } from 'rxjs';
import { SyllabusBlock, SyllabusFilter, TopicResult } from '../../common/models/syllabus.model';
import { pendingReview, toQuizQuestion } from '../../common/utils/pending-review';
import { SyllabusService } from '../services/syllabus.service';
import { TopicResultsService } from '../services/topic-results.service';
import { BlockReview } from '../topic-quiz/topic-quiz.store';

interface SyllabusState {
  blocks: SyllabusBlock[];
  results: TopicResult[];
  filter: SyllabusFilter;
  expandedBlockIds: number[];
  updatingBlockIds: number[];
  isLoading: boolean;
  error: 'loading' | 'saving' | null;
}

const average = (values: number[]): number | null =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

export const SyllabusStore = signalStore(
  withState<SyllabusState>({
    blocks: [],
    results: [],
    filter: 'all',
    expandedBlockIds: [],
    updatingBlockIds: [],
    isLoading: false,
    error: null,
  }),
  withComputed(({ blocks, results, filter }) => ({
    blockReviews: computed<Record<number, BlockReview>>(() =>
      Object.fromEntries(
        blocks().map(({ id, label, name, topics }) => [
          id,
          {
            label,
            name,
            questions: topics.flatMap(({ id: topicId }) =>
              pendingReview(results().filter((result) => result.topicId === topicId)).map(
                (review) => ({ topicId, question: toQuizQuestion(review) }),
              ),
            ),
          },
        ]),
      ),
    ),
    studiedCount: computed(() => blocks().filter(({ isStudied }) => isStudied).length),
    topicCount: computed(() => blocks().reduce((sum, { topics }) => sum + topics.length, 0)),
    practisedTopicCount: computed(
      () =>
        blocks()
          .flatMap(({ topics }) => topics)
          .filter(({ correctPercentage }) => correctPercentage !== null).length,
    ),
    notesCount: computed(() =>
      blocks()
        .flatMap(({ topics }) => topics)
        .reduce((sum, { notesCount }) => sum + notesCount, 0),
    ),
    averagePercentage: computed(() =>
      average(
        blocks().flatMap(({ correctPercentage }) =>
          correctPercentage === null ? [] : [correctPercentage],
        ),
      ),
    ),
    visibleBlocks: computed(() =>
      blocks().filter(
        ({ isStudied }) => filter() === 'all' || (filter() === 'studied') === isStudied,
      ),
    ),
  })),
  withMethods(
    (
      store,
      syllabusService = inject(SyllabusService),
      topicResultsService = inject(TopicResultsService),
    ) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            forkJoin([syllabusService.getBlocks(), topicResultsService.getAllResults()]).pipe(
              tapResponse({
                next: ([blocks, results]) =>
                  patchState(store, {
                    blocks,
                    results,
                    expandedBlockIds: blocks
                      .filter(({ isStudied }) => !isStudied)
                      .slice(0, 1)
                      .map(({ id }) => id),
                    isLoading: false,
                  }),
                error: () => patchState(store, { isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      toggleStudied: rxMethod<number>(
        pipe(
          tap((blockId) =>
            patchState(store, ({ updatingBlockIds }) => ({
              updatingBlockIds: [...updatingBlockIds, blockId],
              error: null,
            })),
          ),
          concatMap((blockId) => {
            const isStudied = !store.blocks().find(({ id }) => id === blockId)?.isStudied;
            return syllabusService.setStudied(blockId, isStudied).pipe(
              tapResponse({
                next: () =>
                  patchState(store, ({ blocks, updatingBlockIds }) => ({
                    blocks: blocks.map((block) =>
                      block.id === blockId ? { ...block, isStudied } : block,
                    ),
                    updatingBlockIds: updatingBlockIds.filter((id) => id !== blockId),
                  })),
                error: () =>
                  patchState(store, ({ updatingBlockIds }) => ({
                    updatingBlockIds: updatingBlockIds.filter((id) => id !== blockId),
                    error: 'saving' as const,
                  })),
              }),
            );
          }),
        ),
      ),
      reloadResults: rxMethod<void>(
        pipe(
          switchMap(() =>
            topicResultsService.getAllResults().pipe(
              tapResponse({
                next: (results) => patchState(store, { results }),
                error: () => patchState(store, { error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      setFilter(filter: SyllabusFilter): void {
        patchState(store, { filter });
      },
      toggleExpanded(blockId: number): void {
        patchState(store, ({ expandedBlockIds }) => ({
          expandedBlockIds: expandedBlockIds.includes(blockId)
            ? expandedBlockIds.filter((id) => id !== blockId)
            : [...expandedBlockIds, blockId],
        }));
      },
    }),
  ),
);
