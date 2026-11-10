import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SyllabusTopicDetail } from '../../common/models/syllabus.model';
import { SyllabusService } from '../services/syllabus.service';
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
};

const setup = (getTopic: (id: number) => ReturnType<SyllabusService['getTopic']>) => {
  TestBed.configureTestingModule({
    providers: [SyllabusTopicStore, { provide: SyllabusService, useValue: { getTopic } }],
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
});
