import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, forkJoin, from, map, pipe, switchMap, tap } from 'rxjs';
import { ExamImportFiles, ParsedExam } from '../../common/models/exam-import.model';
import { NotificationService } from '../../common/services/notification.service';
import { parseOfficialExam } from '../../common/utils/parse-official-exam';
import { READ_PDF_TEXT } from '../../common/utils/read-pdf-text';
import { ExamService } from '../services/exam.service';

interface AdminState {
  examName: string;
  parsedExam: ParsedExam | null;
  isReading: boolean;
  isImporting: boolean;
  error: 'reading' | 'importing' | null;
}

export const AdminStore = signalStore(
  withState<AdminState>({
    examName: '',
    parsedExam: null,
    isReading: false,
    isImporting: false,
    error: null,
  }),
  withComputed(({ parsedExam }) => ({
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
                next: () => {
                  patchState(store, { parsedExam: null, examName: '', isImporting: false });
                  notificationService.success('admin.import.imported');
                },
                error: () => patchState(store, { isImporting: false, error: 'importing' }),
              }),
            ),
          ),
        ),
      ),
      discard(): void {
        patchState(store, { parsedExam: null, examName: '', error: null });
      },
    }),
  ),
);
