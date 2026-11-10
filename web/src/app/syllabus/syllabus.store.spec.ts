import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyllabusBlock } from '../../common/models/syllabus.model';
import { SyllabusService } from '../services/syllabus.service';
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
