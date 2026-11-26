import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, filter, forkJoin, from, map, pipe, switchMap, tap } from 'rxjs';
import { QuizQuestion } from '../../common/models/quiz.model';
import {
  ReviewQuestion,
  SyllabusTopicDetail,
  TopicMaterial,
  TopicResult,
} from '../../common/models/syllabus.model';
import { AccountService } from '../services/account.service';
import { MaterialsService } from '../services/materials.service';
import { NotesService } from '../services/notes.service';
import { SyllabusService } from '../services/syllabus.service';
import { TopicResultsService } from '../services/topic-results.service';
import {
  pendingReview as pendingReviewOf,
  toQuizQuestion,
} from '../../common/utils/pending-review';

const TREND_LENGTH = 5;
const REVIEW_LENGTH = 3;

interface SyllabusTopicState {
  topic: SyllabusTopicDetail | null;
  results: TopicResult[];
  materials: TopicMaterial[];
  isAdmin: boolean;
  materialToDeleteId: number | null;
  isLoading: boolean;
  isUploading: boolean;
  isUploadingMaterials: boolean;
  isDeletingMaterial: boolean;
  error: 'loading' | 'uploading' | 'uploadingMaterials' | 'deletingMaterial' | null;
}

export const SyllabusTopicStore = signalStore(
  withState<SyllabusTopicState>({
    topic: null,
    results: [],
    materials: [],
    isAdmin: false,
    materialToDeleteId: null,
    isLoading: false,
    isUploading: false,
    isUploadingMaterials: false,
    isDeletingMaterial: false,
    error: null,
  }),
  withComputed(({ results, materials, materialToDeleteId }) => {
    const sortedResults = computed(() =>
      [...results()].sort((a, b) => a.date.localeCompare(b.date)),
    );
    const pendingReview = computed(() => pendingReviewOf(results()));
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
      reviewQuiz: computed<QuizQuestion[]>(() => pendingReview().map(toQuizQuestion)),
      materialToDelete: computed(() => materials().find(({ id }) => id === materialToDeleteId())),
    };
  }),
  withMethods(
    (
      store,
      syllabusService = inject(SyllabusService),
      notesService = inject(NotesService),
      topicResultsService = inject(TopicResultsService),
      materialsService = inject(MaterialsService),
      accountService = inject(AccountService),
    ) => ({
      load: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((topicId) =>
            forkJoin({
              topic: syllabusService.getTopic(topicId),
              results: topicResultsService.getTopicResults(topicId),
              materials: materialsService.getTopicMaterials(topicId),
              user: accountService.getCurrentUser(),
            }).pipe(
              tapResponse({
                next: ({ topic, results, materials, user }) =>
                  patchState(store, {
                    topic,
                    results,
                    materials,
                    isAdmin: user.isAdmin,
                    isLoading: false,
                  }),
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
      uploadMaterials: rxMethod<File[]>(
        pipe(
          map((files) => ({ files, topicId: store.topic()?.id })),
          filter(
            (upload): upload is { files: File[]; topicId: number } =>
              upload.topicId !== undefined && upload.files.length > 0,
          ),
          tap(() => patchState(store, { isUploadingMaterials: true, error: null })),
          switchMap(({ files, topicId }) =>
            from(files).pipe(
              concatMap((file) => materialsService.uploadMaterial(topicId, file)),
              tapResponse({
                next: (material) =>
                  patchState(store, ({ materials }) => ({ materials: [...materials, material] })),
                error: () =>
                  patchState(store, { isUploadingMaterials: false, error: 'uploadingMaterials' }),
                finalize: () => patchState(store, { isUploadingMaterials: false }),
              }),
            ),
          ),
        ),
      ),
      deleteMaterial: rxMethod<void>(
        pipe(
          map(() => store.materialToDeleteId()),
          filter((materialId): materialId is number => materialId !== null),
          tap(() => patchState(store, { isDeletingMaterial: true, error: null })),
          switchMap((materialId) =>
            materialsService.deleteMaterial(materialId).pipe(
              tapResponse({
                next: () =>
                  patchState(store, ({ materials }) => ({
                    materials: materials.filter(({ id }) => id !== materialId),
                    materialToDeleteId: null,
                    isDeletingMaterial: false,
                  })),
                error: () =>
                  patchState(store, { isDeletingMaterial: false, error: 'deletingMaterial' }),
              }),
            ),
          ),
        ),
      ),
      openDeleteMaterialModal(materialToDeleteId: number): void {
        patchState(store, { materialToDeleteId });
      },
      closeDeleteMaterialModal(): void {
        patchState(store, { materialToDeleteId: null });
      },
    }),
  ),
);
