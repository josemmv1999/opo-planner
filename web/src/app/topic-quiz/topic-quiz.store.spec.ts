import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuizQuestion } from '../../common/models/quiz.model';
import { SyllabusTopicDetail } from '../../common/models/syllabus.model';
import { QuizService } from '../services/quiz.service';
import { SyllabusService } from '../services/syllabus.service';
import { TopicQuizStore } from './topic-quiz.store';

const TOPIC: SyllabusTopicDetail = {
  id: 5,
  number: 5,
  name: 'Topic',
  blockLabel: 'Block II',
  blockName: 'Block',
  correctPercentage: null,
  laws: [],
  notes: [],
};

const question = (id: number): QuizQuestion => ({
  id,
  caseText: null,
  statement: `Question ${id}`,
  options: ['A', 'B', 'C', 'D'],
  correctOption: 1,
  reasoning: `Reasoning ${id}`,
});

describe('TopicQuizStore', () => {
  let store: InstanceType<typeof TopicQuizStore>;
  const getTopicQuestions = vi.fn((_: number, count: number) =>
    of(Array.from({ length: count }, (__, i) => question(i))),
  );

  beforeEach(() => {
    getTopicQuestions.mockClear();
    TestBed.configureTestingModule({
      providers: [
        TopicQuizStore,
        { provide: SyllabusService, useValue: { getTopic: () => of(TOPIC) } },
        { provide: QuizService, useValue: { getTopicQuestions } },
      ],
    });
    store = TestBed.inject(TopicQuizStore);
    store.loadTopic(5);
  });

  it('starts in the setup with 20 questions by default', () => {
    expect(store.phase()).toBe('setup');
    expect(store.count()).toBe(20);
    expect(store.topic()).toEqual(TOPIC);
  });

  it('asks for as many questions as chosen', () => {
    store.setCount(10);
    store.start();
    expect(getTopicQuestions).toHaveBeenCalledWith(5, 10);
    expect(store.phase()).toBe('playing');
    expect(store.questions().length).toBe(10);
  });

  it('marks right and wrong answers and keeps only the first one', () => {
    store.setCount(10);
    store.start();
    store.answer(1);
    expect(store.isCorrect()).toBe(true);
    store.answer(0);
    expect(store.currentAnswer()).toBe(1);
    store.next();
    store.answer(3);
    expect(store.isCorrect()).toBe(false);
    expect(store.correctCount()).toBe(1);
    expect(store.wrongCount()).toBe(1);
  });

  it('does not move on before answering', () => {
    store.setCount(10);
    store.start();
    store.next();
    expect(store.index()).toBe(0);
  });

  it('finishes after the last question with the score and the failed questions', () => {
    store.setCount(10);
    store.start();
    for (let i = 0; i < 10; i++) {
      store.answer(i < 8 ? 1 : 0);
      store.next();
    }
    expect(store.phase()).toBe('finished');
    expect(store.percentage()).toBe(80);
    expect(store.verdictKey()).toBe('topicQuiz.verdict.great');
    expect(store.wrongQuestions().map(({ id }) => id)).toEqual([8, 9]);
  });

  it('goes back to the setup to play again', () => {
    store.start();
    store.restart();
    expect(store.phase()).toBe('setup');
    expect(store.answers()).toEqual([]);
  });
});
