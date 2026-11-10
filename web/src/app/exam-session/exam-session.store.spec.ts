import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExamDetail } from '../../common/models/exam.model';
import { ExamService } from '../services/exam.service';
import { ExamSessionStore } from './exam-session.store';

const EXAM: ExamDetail = {
  id: 'mixed',
  name: 'Batiburrillo',
  minutes: 1,
  questions: Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    statement: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctOption: 0,
    block: i === 0 ? 'Constitución' : 'Procedimiento',
  })),
};

describe('ExamSessionStore', () => {
  let store: InstanceType<typeof ExamSessionStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        ExamSessionStore,
        { provide: ExamService, useValue: { getExam: () => of(EXAM) } },
      ],
    });
    store = TestBed.inject(ExamSessionStore);
    store.load('mixed');
  });

  afterEach(() => vi.useRealTimers());

  it('starts with every question blank and the full time', () => {
    expect(store.total()).toBe(3);
    expect(store.blankCount()).toBe(3);
    expect(store.secondsLeft()).toBe(60);
  });

  it('answers, changes the answer and moves between questions', () => {
    store.answer(1);
    store.answer(2);
    expect(store.currentAnswer()).toBe(2);
    store.goTo(2);
    expect(store.currentAnswer()).toBeNull();
    store.goTo(3);
    expect(store.index()).toBe(2);
    expect(store.answeredCount()).toBe(1);
  });

  it('flags and unflags the current question', () => {
    store.toggleFlag();
    expect(store.isCurrentFlagged()).toBe(true);
    store.toggleFlag();
    expect(store.isCurrentFlagged()).toBe(false);
  });

  it('counts down and submits when the time runs out', () => {
    store.runTimer();
    vi.advanceTimersByTime(1000);
    expect(store.secondsLeft()).toBe(59);
    expect(store.isTimeLow()).toBe(true);
    vi.advanceTimersByTime(59_000);
    expect(store.secondsLeft()).toBe(0);
    expect(store.hasSubmitted()).toBe(true);
  });

  it('submits after confirming', () => {
    store.openSubmitModal();
    store.submit();
    expect(store.isSubmitModalOpen()).toBe(false);
    expect(store.hasSubmitted()).toBe(true);
  });

  it('scores the exam and lists the weakest blocks', () => {
    store.runTimer();
    vi.advanceTimersByTime(30_000);
    store.answer(0);
    store.goTo(1);
    store.answer(3);
    store.submit();
    expect(store.correctCount()).toBe(1);
    expect(store.wrongCount()).toBe(1);
    expect(store.blankCount()).toBe(1);
    expect(store.percentage()).toBe(33);
    expect(store.secondsTaken()).toBe(30);
    expect(store.secondsPerQuestion()).toBe(10);
    expect(store.weakBlocks()).toEqual([{ name: 'Procedimiento', errorPercentage: 100 }]);
  });

  it('reviews the answers from the first question', () => {
    store.goTo(2);
    store.submit();
    store.startReview();
    expect(store.isReviewing()).toBe(true);
    expect(store.index()).toBe(0);
    store.closeReview();
    expect(store.isReviewing()).toBe(false);
  });
});
