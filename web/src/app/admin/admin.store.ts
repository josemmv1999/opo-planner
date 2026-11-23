import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, forkJoin, from, map, pipe, switchMap, tap } from 'rxjs';
import { ExamImportFiles, ImportedExam, ParsedExam } from '../../common/models/exam-import.model';
import { NotificationService } from '../../common/services/notification.service';
import { parseOfficialExam } from '../../common/utils/parse-official-exam';
import { READ_PDF_TEXT } from '../../common/utils/read-pdf-text';
import { ExamService } from '../services/exam.service';

interface AdminState {
  examName: string;
  parsedExam: ParsedExam | null;
  isReading: boolean;
  isImporting: boolean;
  importedExams: ImportedExam[];
  isLoadingImported: boolean;
  examToDeleteId: number | null;
  isDeleting: boolean;
  error: 'reading' | 'importing' | 'loadingImported' | 'deleting' | null;
}

export const AdminStore = signalStore(
  withState<AdminState>({
    examName: '',
    parsedExam: null,
    isReading: false,
    isImporting: false,
    importedExams: [],
    isLoadingImported: false,
    examToDeleteId: null,
    isDeleting: false,
    error: null,
  }),
  withComputed(({ parsedExam, importedExams, examToDeleteId }) => ({
    examToDelete: computed(() => importedExams().find(({ id }) => id === examToDeleteId())),
    importSummary: computed(() => {
      const questions = parsedExam()?.questions ?? [];
      return {
        questions: questions.filter(({ isReserve }) => !isReserve).length,
        reserve: questions.filter(({ isReserve }) => isReserve).length,
        voided: questions.filter(({ isVoided }) => isVoided).length,
      };
    }),
    canImport: computed(() => !!parsedExam()?.questions.length && !parsedExam()?.errors.length),
  })),
  withMethods(
    (
      store,
      examService = inject(ExamService),
      notificationService = inject(NotificationService),
      readPdfText = inject(READ_PDF_TEXT),
    ) => ({
      read: rxMethod<ExamImportFiles & { name: string }>(
        pipe(
          tap(({ name }) =>
            patchState(store, { examName: name, parsedExam: null, isReading: true, error: null }),
          ),
          switchMap(({ questionnaire, answerKey }) =>
            forkJoin([from(readPdfText(questionnaire)), from(readPdfText(answerKey))]).pipe(
              map(([questionnaireText, answerKeyText]) =>
                parseOfficialExam(questionnaireText, answerKeyText),
              ),
              tapResponse({
                next: (parsedExam) => patchState(store, { parsedExam, isReading: false }),
                error: () => patchState(store, { isReading: false, error: 'reading' }),
              }),
            ),
          ),
        ),
      ),
      importExam: rxMethod<void>(
        pipe(
          map(() => store.parsedExam()),
          filter((parsedExam): parsedExam is ParsedExam => !!parsedExam),
          tap(() => patchState(store, { isImporting: true, error: null })),
          switchMap(({ questions }) =>
            examService.importOfficialExam(store.examName(), questions).pipe(
              tapResponse({
                next: (exam) => {
                  patchState(store, {
                    parsedExam: null,
                    examName: '',
                    isImporting: false,
                    importedExams: [exam, ...store.importedExams()],
                  });
                  notificationService.success('admin.import.imported');
                },
                error: () => patchState(store, { isImporting: false, error: 'importing' }),
              }),
            ),
          ),
        ),
      ),
      loadImported: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoadingImported: true, error: null })),
          switchMap(() =>
            examService.getImportedExams().pipe(
              tapResponse({
                next: (importedExams) =>
                  patchState(store, { importedExams, isLoadingImported: false }),
                error: () =>
                  patchState(store, { isLoadingImported: false, error: 'loadingImported' }),
              }),
            ),
          ),
        ),
      ),
      deleteExam: rxMethod<void>(
        pipe(
          map(() => store.examToDeleteId()),
          filter((examId): examId is number => examId !== null),
          tap(() => patchState(store, { isDeleting: true, error: null })),
          switchMap((examId) =>
            examService.deleteImportedExam(examId).pipe(
              tapResponse({
                next: () => {
                  patchState(store, {
                    importedExams: store.importedExams().filter(({ id }) => id !== examId),
                    examToDeleteId: null,
                    isDeleting: false,
                  });
                  notificationService.success('admin.imported.deleted');
                },
                error: () => patchState(store, { isDeleting: false, error: 'deleting' }),
              }),
            ),
          ),
        ),
      ),
      openDeleteModal(examToDeleteId: number): void {
        patchState(store, { examToDeleteId });
      },
      closeDeleteModal(): void {
        patchState(store, { examToDeleteId: null });
      },
      discard(): void {
        patchState(store, { parsedExam: null, examName: '', error: null });
      },
    }),
  ),
);
