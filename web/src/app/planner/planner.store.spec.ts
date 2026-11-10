import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlannerWeek } from '../../common/models/planner.model';
import { PlannerService } from '../services/planner.service';
import { PlannerStore } from './planner.store';

const WEEK: PlannerWeek = {
  examDate: '2099-01-01',
  schedule: { days: [0], slots: [{ start: '17:00', end: '20:00' }] },
  entries: [
    {
      id: 1,
      text: 'Repasar',
      start: '2026-11-09T17:00:00',
      end: '2026-11-09T18:30:00',
      isDone: false,
      isRecord: false,
    },
    {
      id: 2,
      text: 'Leer',
      start: '2026-11-09T18:00:00',
      end: '2026-11-09T19:00:00',
      isDone: false,
      isRecord: false,
    },
  ],
};

describe('PlannerStore', () => {
  let store: InstanceType<typeof PlannerStore>;
  let requestedWeeks: string[];

  beforeEach(() => {
    requestedWeeks = [];
    TestBed.configureTestingModule({
      providers: [
        PlannerStore,
        {
          provide: PlannerService,
          useValue: {
            getWeek: (weekStart: string) => {
              requestedWeeks.push(weekStart);
              return of(WEEK);
            },
          },
        },
      ],
    });
    store = TestBed.inject(PlannerStore);
  });

  it('places each entry in its day and cascades the overlapping ones', () => {
    store.load('2026-11-09');
    const monday = store.days()[0];
    expect(monday.date).toBe('2026-11-09');
    expect(monday.entries.map(({ id, lane }) => ({ id, lane }))).toEqual([
      { id: 1, lane: 0 },
      { id: 2, lane: 1 },
    ]);
    expect(monday.entries[0]).toMatchObject({ startRow: 41, endRow: 47 });
    expect(monday.studyRows).toEqual([{ startRow: 41, endRow: 53 }]);
    expect(store.days()[1].studyRows).toEqual([]);
  });

  it('moves between weeks and back to today', () => {
    const current = store.weekStart();
    store.load(store.weekStart);
    TestBed.tick();
    store.nextWeek();
    TestBed.tick();
    store.previousWeek();
    store.previousWeek();
    TestBed.tick();
    expect(requestedWeeks).toHaveLength(3);
    expect(requestedWeeks[1] > current && requestedWeeks[2] < current).toBe(true);
    store.goToToday();
    expect(store.weekStart()).toBe(current);
  });

  it('toggles an entry as done', () => {
    store.load('2026-11-09');
    store.toggleDone(1);
    expect(store.entries()[0].isDone).toBe(true);
  });
});
