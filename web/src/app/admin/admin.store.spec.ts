import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ParsedQuestion } from '../../common/models/exam-import.model';
import { NotificationService } from '../../common/services/notification.service';
import { READ_PDF_TEXT } from '../../common/utils/read-pdf-text';
import { ExamService } from '../services/exam.service';
import { SyllabusService } from '../services/syllabus.service';
import { AdminStore } from './admin.store';

const QUESTIONNAIRE = `PRIMERA PARTE
1. ¿Quién sanciona las leyes?
a) El Rey. b) El Gobierno.
c) El Congreso. d) El Senado.
2. ¿Cuántos artículos tiene la Constitución?
a) 155. b) 169.
c) 176. d) 184.
Preguntas de reserva
1. ¿Quién nombra al Presidente del Gobierno?
a) El Rey. b) El Congreso.
c) El Senado. d) El Consejo de Ministros.`;

const pdf = (text: string): File => new File([text], 'exam.pdf');

describe('AdminStore', () => {
  let store: InstanceType<typeof AdminStore>;
  const importOfficialExam = vi.fn((name: string, questions: ParsedQuestion[]) =>
    of({ id: 1000, name, importedAt: '', questions }),
  );

  const read = async (answerKey: string): Promise<void> => {
    store.read({
      name: 'Convocatoria 2025',
      questionnaire: pdf(QUESTIONNAIRE),
      answerKey: pdf(answerKey),
    });
    await vi.waitFor(() => expect(store.isReading()).toBe(false));
  };

  const deleteImportedExam = vi.fn(() => of(undefined));
  const classifyQuestions = (questions: ParsedQuestion[]) => of(questions.map(() => 3));
  const getImportedExams = () =>
    of([
      { id: 1000, name: 'A', importedAt: '', questions: [] },
      { id: 1001, name: 'B', importedAt: '', questions: [] },
    ]);

  beforeEach(() => {
    importOfficialExam.mockClear();
    TestBed.configureTestingModule({
      providers: [
        AdminStore,
        {
          provide: ExamService,
          useValue: { importOfficialExam, getImportedExams, deleteImportedExam, classifyQuestions },
        },
        { provide: SyllabusService, useValue: { getBlocks: () => of([]) } },
        { provide: NotificationService, useValue: { success: vi.fn() } },
        { provide: READ_PDF_TEXT, useValue: (file: File) => file.text() },
      ],
    });
    store = TestBed.inject(AdminStore);
  });

  it('reads both PDFs and summarises the exam', async () => {
    await read('Primera parte\n1. a\n2. ANULADA\nPreguntas de reserva\n1. a');
    expect(store.importSummary()).toEqual({ questions: 2, reserve: 1, voided: 1, withoutTopic: 0 });
    expect(store.canImport()).toBe(true);
  });

  it('does not allow importing an exam with errors', async () => {
    await read('Primera parte\n1. a');
    expect(store.parsedExam()?.errors.length).toBe(2);
    expect(store.canImport()).toBe(false);
  });

  it('imports the reviewed exam with its name and clears the review', async () => {
    await read('Primera parte\n1. a\n2. b\nPreguntas de reserva\n1. a');
    store.importExam();
    expect(importOfficialExam).toHaveBeenCalledWith('Convocatoria 2025', expect.any(Array));
    expect(store.parsedExam()).toBeNull();
  });

  it('deletes the confirmed imported exam', async () => {
    store.loadImported();
    await vi.waitFor(() => expect(store.importedExams().length).toBe(2));
    store.openDeleteModal(1000);
    store.deleteExam();
    expect(deleteImportedExam).toHaveBeenCalledWith(1000);
    expect(store.importedExams().map(({ id }) => id)).toEqual([1001]);
    expect(store.examToDelete()).toBeUndefined();
  });

  it('suggests a topic for each question and lets the admin change it', async () => {
    await read('Primera parte\n1. a\n2. b\nPreguntas de reserva\n1. a');
    expect(store.parsedExam()?.questions.map(({ topicId }) => topicId)).toEqual([3, 3, 3]);
    store.setQuestionTopic({ index: 1, topicId: null });
    expect(store.parsedExam()?.questions[1].topicId).toBeNull();
    expect(store.importSummary().withoutTopic).toBe(1);
  });
});
