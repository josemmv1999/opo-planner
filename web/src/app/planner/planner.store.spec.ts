import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudySchedule } from '../../common/models/onboarding.model';
import { PlannerEntry, PlannerWeek, TaskDraft } from '../../common/models/planner.model';
import { PlannerService } from '../services/planner.service';
import { PlannerStore } from './planner.store';

const WEEK: PlannerWeek = {
  examDate: '2099-01-01',
  schedule: { days: [0], slots: [{ start: '17:00', end: '20:00' }] },
  otherSchedules: [
    {
      oppositionName: 'Seguridad Social',
      schedule: { days: [0], slots: [{ start: '18:00', end: '19:00' }] },
    },
  ],
  otherEntries: [
    {
      id: 50,
      text: 'Otra',
      start: '2026-11-09T10:00:00',
      end: '2026-11-09T11:00:00',
      oppositionName: 'Seguridad Social',
    },
  ],
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
            setDone: (taskId: number) => of(taskId),
            saveSchedule: (schedule: StudySchedule) => of(schedule),
            saveExamDate: (date: string) => of(date),
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

  it('moves a task to another day and time', () => {
    store.load('2026-11-09');
    store.moveTask({ id: 1, date: '2026-11-10', start: '09:00', end: '11:00' });
    const tuesday = store.days()[1].entries;
    expect(tuesday.map(({ id }) => id)).toEqual([1]);
    expect(tuesday[0]).toMatchObject({ startRow: 9, endRow: 17 });
    expect(store.days()[0].entries.map(({ id }) => id)).toEqual([2]);
  });

  it('puts a task back when the move fails', () => {
    store.load('2026-11-09');
    const original = store.entries()[0];
    vi.spyOn(TestBed.inject(PlannerService), 'saveTask').mockReturnValue(
      throwError(() => new Error('down')),
    );
    store.moveTask({ id: 1, date: '2026-11-10', start: '09:00', end: '11:00' });
    expect(store.entries()[0]).toEqual(original);
    expect(store.error()).toBe('moving');
  });

  it('adds the other oppositions to the full calendar', () => {
    store.load('2026-11-09');
    expect(store.days()[0].entries.map(({ id }) => id)).toEqual([1, 2]);
    store.showFullCalendar(true);
    expect(
      store.days()[0].entries.map(({ id, oppositionName }) => ({ id, oppositionName })),
    ).toEqual([
      { id: 50, oppositionName: 'Seguridad Social' },
      { id: 1, oppositionName: null },
      { id: 2, oppositionName: null },
    ]);
  });

  it('edits the study schedule in a draft and saves it', () => {
    store.load('2026-11-09');
    store.openScheduleModal();
    store.toggleScheduleDay(1);
    store.addScheduleSlot();
    expect(store.scheduleDraft()).toEqual({
      days: [0, 1],
      slots: [
        { start: '17:00', end: '20:00' },
        { start: '20:00', end: '22:00' },
      ],
    });
    expect(store.scheduleClashes()[0]?.oppositionName).toBe('Seguridad Social');
    expect(store.schedule().days).toEqual([0]);
    store.saveSchedule();
    expect(store.schedule().days).toEqual([0, 1]);
    expect(store.isScheduleModalOpen()).toBe(false);
  });

  it('saves a new exam date and ignores an empty one', () => {
    store.load('2026-11-09');
    store.saveExamDate('2027-09-20');
    expect(store.examDate()).toBe('2027-09-20');
    store.saveExamDate('');
    expect(store.examDate()).toBe('2027-09-20');
  });
});
