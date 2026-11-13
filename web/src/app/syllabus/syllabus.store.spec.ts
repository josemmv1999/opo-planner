import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewQuestion, SyllabusBlock, TopicResult } from '../../common/models/syllabus.model';
import { SyllabusService } from '../services/syllabus.service';
import { TopicResultsService } from '../services/topic-results.service';
import { SyllabusStore } from './syllabus.store';

const block = (
  id: number,
  isStudied: boolean,
  correctPercentage: number | null,
  topics = 2,
): SyllabusBlock => ({
  id,
  label: `Bloque ${id}`,
  name: `Block ${id}`,
  correctPercentage,
  isStudied,
  topics: Array.from({ length: topics }, (_, i) => ({
    id: id * 10 + i,
    number: i + 1,
    name: `Topic ${i}`,
    correctPercentage: i === 0 ? correctPercentage : null,
    notesCount: i,
  })),
});

const mistake = (questionId: number): ReviewQuestion => ({
  questionId,
  statement: `Question ${questionId}`,
  options: ['A', 'B'],
  chosenOption: 0,
  correctOption: 1,
  reasoning: 'Because',
});

const RESULTS: TopicResult[] = [
  {
    id: 1,
    topicId: 20,
    date: '2026-11-01',
    percentage: 0,
    mistakes: [mistake(1), mistake(2)],
    correctQuestionIds: [],
    isReview: false,
  },
  {
    id: 2,
    topicId: 22,
    date: '2026-11-02',
    percentage: 0,
    mistakes: [mistake(3)],
    correctQuestionIds: [],
    isReview: false,
  },
];

describe('SyllabusStore', () => {
  let store: InstanceType<typeof SyllabusStore>;
  const setStudied = vi.fn((blockId: number, isStudied: boolean) => of({ blockId, isStudied }));

  beforeEach(() => {
    setStudied.mockClear();
    TestBed.configureTestingModule({
      providers: [
        SyllabusStore,
        {
          provide: SyllabusService,
          useValue: {
            getBlocks: () =>
              of([block(1, true, 80), block(2, false, 40, 3), block(3, false, null)]),
            setStudied,
          },
        },
        { provide: TopicResultsService, useValue: { getAllResults: () => of(RESULTS) } },
      ],
    });
    store = TestBed.inject(SyllabusStore);
    store.load();
  });

  it('loads the blocks and opens the first pending one', () => {
    expect(store.blocks().length).toBe(3);
    expect(store.expandedBlockIds()).toEqual([2]);
    expect(store.isLoading()).toBe(false);
  });

  it('gathers the pending mistakes of each block with their topic', () => {
    const review = store.blockReviews()[2];
    expect(review.label).toBe('Bloque 2');
    expect(review.questions.map(({ topicId, question }) => [topicId, question.id])).toEqual([
      [20, 1],
      [20, 2],
      [22, 3],
    ]);
    expect(store.blockReviews()[1].questions).toEqual([]);
  });

  it('sums up studied blocks, topics and the average ignoring blocks without data', () => {
    expect(store.studiedCount()).toBe(1);
    expect(store.topicCount()).toBe(7);
    expect(store.averagePercentage()).toBe(60);
  });

  it('counts practised topics and notes', () => {
    expect(store.practisedTopicCount()).toBe(2);
    expect(store.notesCount()).toBe(5);
  });

  it('filters pending and studied blocks', () => {
    store.setFilter('pending');
    expect(store.visibleBlocks().map(({ id }) => id)).toEqual([2, 3]);
    store.setFilter('studied');
    expect(store.visibleBlocks().map(({ id }) => id)).toEqual([1]);
  });

  it('expands and collapses a block', () => {
    store.toggleExpanded(1);
    expect(store.expandedBlockIds()).toEqual([2, 1]);
    store.toggleExpanded(2);
    expect(store.expandedBlockIds()).toEqual([1]);
  });

  it('marks a block as studied and back', () => {
    store.toggleStudied(2);
    expect(setStudied).toHaveBeenCalledWith(2, true);
    expect(store.blocks().find(({ id }) => id === 2)?.isStudied).toBe(true);
    store.toggleStudied(2);
    expect(store.blocks().find(({ id }) => id === 2)?.isStudied).toBe(false);
    expect(store.updatingBlockIds()).toEqual([]);
  });

  it('keeps the block as it was when saving fails', () => {
    setStudied.mockReturnValueOnce(throwError(() => new Error('fail')));
    store.toggleStudied(2);
    expect(store.blocks().find(({ id }) => id === 2)?.isStudied).toBe(false);
    expect(store.error()).toBe('saving');
    expect(store.updatingBlockIds()).toEqual([]);
  });
});
