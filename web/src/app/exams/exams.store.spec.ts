import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ExamAttempt, OfficialExam } from '../../common/models/exam.model';
import { SyllabusBlock } from '../../common/models/syllabus.model';
import { ExamService } from '../services/exam.service';
import { SyllabusService } from '../services/syllabus.service';
import { ExamsStore } from './exams.store';

const OFFICIAL: OfficialExam[] = [
  { id: 1, name: 'Convocatoria 2025', questionCount: 60, minutes: 60, lastPercentage: null },
];
const HISTORY: ExamAttempt[] = [
  {
    id: 1,
    kind: 'mixed',
    name: 'Batiburrillo',
    date: '2026-11-08',
    minutesTaken: 52,
    percentage: 68,
  },
];

const BLOCKS: SyllabusBlock[] = [
  {
    id: 1,
    label: 'Bloque I',
    name: 'Estado',
    correctPercentage: null,
    isStudied: false,
    topics: [],
  },
];

const setup = (getHistory: ExamService['getHistory']) => {
  TestBed.configureTestingModule({
    providers: [
      ExamsStore,
      { provide: ExamService, useValue: { getOfficialExams: () => of(OFFICIAL), getHistory } },
      { provide: SyllabusService, useValue: { getBlocks: () => of(BLOCKS) } },
    ],
  });
  const store = TestBed.inject(ExamsStore);
  store.load();
  return store;
};

describe('ExamsStore', () => {
  it('loads the official exams, the history and the syllabus blocks together', () => {
    const store = setup(() => of(HISTORY));
    expect(store.officialExams()).toEqual(OFFICIAL);
    expect(store.history()).toEqual(HISTORY);
    expect(store.blocks()).toEqual(BLOCKS);
    expect(store.isLoading()).toBe(false);
  });

  it('opens and closes the custom test modal', () => {
    const store = setup(() => of(HISTORY));
    store.openCustomModal();
    expect(store.isCustomModalOpen()).toBe(true);
    store.closeCustomModal();
    expect(store.isCustomModalOpen()).toBe(false);
  });

  it('flags a loading error when one of the requests fails', () => {
    const store = setup(() => throwError(() => new Error('down')));
    expect(store.error()).toBe('loading');
    expect(store.isLoading()).toBe(false);
  });
});
