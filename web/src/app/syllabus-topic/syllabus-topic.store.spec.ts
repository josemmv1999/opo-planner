import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SyllabusTopicDetail, TopicResult } from '../../common/models/syllabus.model';
import { NotesService } from '../services/notes.service';
import { SyllabusService } from '../services/syllabus.service';
import { TopicResultsService } from '../services/topic-results.service';
import { SyllabusTopicStore } from './syllabus-topic.store';

const TOPIC: SyllabusTopicDetail = {
  id: 5,
  number: 5,
  name: 'Topic',
  blockLabel: 'Block II',
  blockName: 'Block',
  correctPercentage: 40,
  laws: [],
  notes: [],
  previousTopic: null,
  nextTopic: null,
};

const RESULTS: TopicResult[] = [
  {
    id: 2,
    topicId: 5,
    date: '2026-11-08T10:00:00Z',
    percentage: 80,
    mistakes: [],
    correctQuestionIds: [],
    isReview: false,
  },
  {
    id: 1,
    topicId: 5,
    date: '2026-11-01T10:00:00Z',
    percentage: 60,
    correctQuestionIds: [],
    isReview: false,
    mistakes: [
      {
        questionId: 9,
        statement: 'Q',
        options: ['A', 'B'],
        chosenOption: 0,
        correctOption: 1,
        reasoning: 'R',
      },
    ],
  },
];

const setup = (getTopic: (id: number) => ReturnType<SyllabusService['getTopic']>) => {
  TestBed.configureTestingModule({
    providers: [
      SyllabusTopicStore,
      { provide: SyllabusService, useValue: { getTopic } },
      { provide: NotesService, useValue: {} },
      { provide: TopicResultsService, useValue: { getTopicResults: () => of(RESULTS) } },
    ],
  });
  return TestBed.inject(SyllabusTopicStore);
};

describe('SyllabusTopicStore', () => {
  it('loads the topic', () => {
    const store = setup(() => of(TOPIC));
    store.load(5);
    expect(store.topic()).toEqual(TOPIC);
    expect(store.isLoading()).toBe(false);
  });

  it('flags the error when the topic cannot be loaded', () => {
    const store = setup(() => throwError(() => new Error('not found')));
    store.load(99);
    expect(store.topic()).toBeNull();
    expect(store.error()).toBe('loading');
  });

  it('sorts the results into a trend and lists the questions to review', () => {
    const store = setup(() => of(TOPIC));
    store.load(5);
    expect(store.trend().map(({ percentage }) => percentage)).toEqual([60, 80]);
    expect(store.improvement()).toBe(20);
    expect(store.reviewQuestions().map(({ questionId }) => questionId)).toEqual([9]);
  });

  it('drops a question from review once a later quiz gets it right', () => {
    TestBed.configureTestingModule({
      providers: [
        SyllabusTopicStore,
        { provide: SyllabusService, useValue: { getTopic: () => of(TOPIC) } },
        { provide: NotesService, useValue: {} },
        {
          provide: TopicResultsService,
          useValue: {
            getTopicResults: () => of([{ ...RESULTS[0], correctQuestionIds: [9] }, RESULTS[1]]),
          },
        },
      ],
    });
    const store = TestBed.inject(SyllabusTopicStore);
    store.load(5);
    expect(store.reviewCount()).toBe(0);
  });

  it('leaves review rounds out of the trend', () => {
    TestBed.configureTestingModule({
      providers: [
        SyllabusTopicStore,
        { provide: SyllabusService, useValue: { getTopic: () => of(TOPIC) } },
        { provide: NotesService, useValue: {} },
        {
          provide: TopicResultsService,
          useValue: {
            getTopicResults: () =>
              of([{ ...RESULTS[0], id: 3, percentage: 100, isReview: true }, ...RESULTS]),
          },
        },
      ],
    });
    const store = TestBed.inject(SyllabusTopicStore);
    store.load(5);
    expect(store.trend().map(({ id }) => id)).toEqual([1, 2]);
    expect(store.improvement()).toBe(20);
  });
});
