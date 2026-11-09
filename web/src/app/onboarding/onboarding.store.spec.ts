import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingData, OppositionOption } from '../../common/models/onboarding.model';
import { OnboardingService } from '../services/onboarding.service';
import { OnboardingStore } from './onboarding.store';

const OPPOSITIONS: OppositionOption[] = [
  { id: 'a', level: 'C1', name: 'Oposición A', body: 'AGE' },
  { id: 'b', level: 'C2', name: 'Oposición B', body: 'AGE' },
];

describe('OnboardingStore', () => {
  let store: InstanceType<typeof OnboardingStore>;
  let save: ReturnType<typeof vi.fn<(data: OnboardingData) => Observable<void>>>;

  beforeEach(() => {
    save = vi.fn<(data: OnboardingData) => Observable<void>>(() => of(undefined));
    TestBed.configureTestingModule({
      providers: [
        OnboardingStore,
        { provide: OnboardingService, useValue: { getOppositions: () => of(OPPOSITIONS), save } },
      ],
    });
    store = TestBed.inject(OnboardingStore);
    store.loadOppositions();
  });

  it('loads the oppositions', () => {
    expect(store.oppositions()).toEqual(OPPOSITIONS);
    expect(store.isLoadingOppositions()).toBe(false);
  });

  it('does not leave the first step without an opposition', () => {
    store.next();
    expect(store.stepError()).toBe('noOpposition');
    expect(store.currentStep()).toBe('oppositions');
  });

  it('gives the first opposition the default schedule and the next ones no slots', () => {
    store.toggleOpposition('a');
    store.toggleOpposition('b');

    expect(store.schedules()['a'].slots.length).toBe(2);
    expect(store.schedules()['b']).toEqual({ days: [0, 1, 2, 3, 4], slots: [] });
    expect(store.activeScheduleId()).toBe('a');
  });

  it('does not leave the schedule step while a schedule is incomplete', () => {
    store.toggleOpposition('a');
    store.toggleOpposition('b');
    store.next();
    store.next();

    expect(store.stepError()).toBe('incompleteSchedule');
    expect(store.pendingOpposition()?.id).toBe('b');
  });

  it('blocks overlapping slots and counts the overlap once', () => {
    store.toggleOpposition('a');
    store.updateSlot(1, 'start', '10:00');
    store.updateSlot(1, 'end', '12:00');

    expect(store.activeSlotIssues().map((issue) => issue?.kind)).toEqual(['overlap', 'overlap']);
    expect(store.activeWeeklyHours()).toBe(15);
    expect(store.completedScheduleIds().has('a')).toBe(false);
  });

  it('warns about clashes with another opposition without blocking', () => {
    store.toggleOpposition('a');
    store.toggleOpposition('b');
    store.selectSchedule('b');
    store.addSlot();
    store.updateSlot(0, 'start', '18:00');
    store.updateSlot(0, 'end', '19:00');

    expect(store.activeSlotClashes()[0]).toEqual({
      oppositionName: 'Oposición A',
      days: [0, 1, 2, 3, 4],
      start: '18:00',
      end: '18:30',
    });
    expect(store.pendingOpposition()).toBeNull();
  });

  it('adds a two-hour slot after the last one', () => {
    store.toggleOpposition('a');
    store.addSlot();
    expect(store.activeSchedule()?.slots.at(-1)).toEqual({ start: '18:30', end: '20:30' });
  });

  it('saves on the last step and finishes', () => {
    store.toggleOpposition('a');
    store.setInterfaceMode('touch');
    store.next();
    store.next();
    store.next();

    expect(save).toHaveBeenCalledWith({
      oppositionIds: ['a'],
      schedules: { a: store.schedules()['a'] },
      interfaceMode: 'touch',
    });
    expect(store.hasFinished()).toBe(true);
  });

  it('skips the interface step and does not send it when there is no interface step', () => {
    store.setHasInterfaceStep(false);
    store.toggleOpposition('a');
    store.next();
    store.next();

    expect(save.mock.calls[0][0].interfaceMode).toBeNull();
    expect(store.hasFinished()).toBe(true);
  });

  it('keeps the user on the page when saving fails', () => {
    save.mockReturnValue(throwError(() => new Error('fail')));
    store.setHasInterfaceStep(false);
    store.toggleOpposition('a');
    store.next();
    store.next();

    expect(store.error()).toBe('saving');
    expect(store.isSaving()).toBe(false);
    expect(store.hasFinished()).toBe(false);
  });
});
