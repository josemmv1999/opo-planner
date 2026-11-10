import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, pipe, switchMap, tap } from 'rxjs';
import { SyllabusBlock, SyllabusFilter } from '../../common/models/syllabus.model';
import { SyllabusService } from '../services/syllabus.service';

interface SyllabusState {
  blocks: SyllabusBlock[];
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
    filter: 'all',
    expandedBlockIds: [],
    updatingBlockIds: [],
    isLoading: false,
    error: null,
  }),
  withComputed(({ blocks, filter }) => ({
    studiedCount: computed(() => blocks().filter(({ isStudied }) => isStudied).length),
    topicCount: computed(() => blocks().reduce((sum, { topics }) => sum + topics.length, 0)),
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
  withMethods((store, syllabusService = inject(SyllabusService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          syllabusService.getBlocks().pipe(
            tapResponse({
              next: (blocks) =>
                patchState(store, {
                  blocks,
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
  })),
);
