import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlannerEntry, PlannerWeek, TaskDraft } from '../../common/models/planner.model';
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
            saveTask: (taskId: number | null, { text, date, start, end }: TaskDraft) =>
              of<PlannerEntry>({
                id: taskId ?? 99,
                text,
                start: `${date}T${start}:00`,
                end: `${date}T${end}:00`,
                isDone: false,
                isRecord: false,
              }),
            deleteTask: (taskId: number) => of(taskId),
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

  it('opens a new task at the chosen slot and saves it', () => {
    store.load('2026-11-09');
    store.openNewTask({ date: '2026-11-10', start: '09:30' });
    expect(store.isTaskModalOpen()).toBe(true);
    expect(store.taskDraft()).toEqual({
      text: '',
      date: '2026-11-10',
      start: '09:30',
      end: '10:30',
    });
    store.saveTask({ text: 'Nueva', date: '2026-11-10', start: '09:30', end: '10:30' });
    expect(store.entries().map(({ id }) => id)).toEqual([1, 2, 99]);
    expect(store.isTaskModalOpen()).toBe(false);
  });

  it('edits a task keeping it done', () => {
    store.load('2026-11-09');
    store.toggleDone(1);
    store.openTask(1);
    expect(store.taskDraft()).toEqual({
      text: 'Repasar',
      date: '2026-11-09',
      start: '17:00',
      end: '18:30',
    });
    store.saveTask({ text: 'Repasar más', date: '2026-11-09', start: '17:00', end: '19:00' });
    expect(store.entries()[0]).toMatchObject({ text: 'Repasar más', isDone: true });
  });

  it('deletes the task being edited', () => {
    store.load('2026-11-09');
    store.openTask(2);
    store.deleteTask();
    expect(store.entries().map(({ id }) => id)).toEqual([1]);
    expect(store.isTaskModalOpen()).toBe(false);
  });
});
