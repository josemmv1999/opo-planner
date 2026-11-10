import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import {
  InterfaceMode,
  OppositionOption,
  StudySchedule,
  TimeSlot,
} from '../../common/models/onboarding.model';
import { OnboardingService } from '../services/onboarding.service';
import {
  addScheduleSlot,
  findClash,
  isScheduleComplete,
  removeScheduleSlot,
  slotIssue,
  toggleScheduleDay,
  updateScheduleSlot,
  weeklyMinutes,
} from './schedule';

export type OnboardingStep = 'oppositions' | 'schedule' | 'interface';

const WEEKDAYS = [0, 1, 2, 3, 4];
const DEFAULT_SLOTS: TimeSlot[] = [
  { start: '09:00', end: '11:00' },
  { start: '17:00', end: '18:30' },
];

interface OnboardingState {
  oppositions: OppositionOption[];
  selectedIds: string[];
  schedules: Record<string, StudySchedule>;
  activeScheduleId: string | null;
  stepIndex: number;
  hasInterfaceStep: boolean;
  interfaceMode: InterfaceMode;
  stepError: 'noOpposition' | 'incompleteSchedule' | null;
  isLoadingOppositions: boolean;
  isSaving: boolean;
  hasFinished: boolean;
  error: 'loading' | 'saving' | null;
}

const initialSchedule = (isFirst: boolean): StudySchedule => ({
  days: WEEKDAYS,
  slots: isFirst ? DEFAULT_SLOTS : [],
});

const updateSchedule = (
  schedules: Record<string, StudySchedule>,
  id: string | null,
  update: (schedule: StudySchedule) => StudySchedule,
): Record<string, StudySchedule> =>
  id && schedules[id] ? { ...schedules, [id]: update(schedules[id]) } : schedules;

export const OnboardingStore = signalStore(
  withState<OnboardingState>({
    oppositions: [],
    selectedIds: [],
    schedules: {},
    activeScheduleId: null,
    stepIndex: 0,
    hasInterfaceStep: true,
    interfaceMode: 'desktop',
    stepError: null,
    isLoadingOppositions: false,
    isSaving: false,
    hasFinished: false,
    error: null,
  }),
  withComputed(
    ({ oppositions, selectedIds, schedules, activeScheduleId, stepIndex, hasInterfaceStep }) => {
      const selectedOppositions = computed(() =>
        oppositions().filter(({ id }) => selectedIds().includes(id)),
      );
      const steps = computed<OnboardingStep[]>(() =>
        hasInterfaceStep() ? ['oppositions', 'schedule', 'interface'] : ['oppositions', 'schedule'],
      );
      const activeSchedule = computed(() => schedules()[activeScheduleId() ?? ''] ?? null);
      const completedScheduleIds = computed(
        () =>
          new Set(
            selectedIds().filter((id) => schedules()[id] && isScheduleComplete(schedules()[id])),
          ),
      );
      const activeSlotIssues = computed(
        () => activeSchedule()?.slots.map((_, i, slots) => slotIssue(slots, i)) ?? [],
      );
      const otherSchedules = computed(() =>
        selectedOppositions()
          .filter(({ id }) => id !== activeScheduleId() && schedules()[id])
          .map(({ id, name }) => ({ oppositionName: name, schedule: schedules()[id] })),
      );

      return {
        selectedOppositions,
        steps,
        currentStep: computed(() => steps()[stepIndex()]),
        isLastStep: computed(() => stepIndex() === steps().length - 1),
        activeSchedule,
        completedScheduleIds,
        pendingOpposition: computed(
          () => selectedOppositions().find(({ id }) => !completedScheduleIds().has(id)) ?? null,
        ),
        activeSlotIssues,
        activeSlotClashes: computed(() => {
          const schedule = activeSchedule();
          return (
            schedule?.slots.map((slot, i) =>
              activeSlotIssues()[i] ? null : findClash(slot, schedule.days, otherSchedules()),
            ) ?? []
          );
        }),
        activeWeeklyHours: computed(() => {
          const schedule = activeSchedule();
          return schedule ? weeklyMinutes(schedule) / 60 : 0;
        }),
      };
    },
  ),
  withMethods((store, onboardingService = inject(OnboardingService)) => {
    const save = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isSaving: true, error: null })),
        switchMap(() =>
          onboardingService
            .save({
              oppositionIds: store.selectedIds(),
              schedules: Object.fromEntries(
                store.selectedIds().map((id) => [id, store.schedules()[id]]),
              ),
              interfaceMode: store.hasInterfaceStep() ? store.interfaceMode() : null,
            })
            .pipe(
              tapResponse({
                next: () => patchState(store, { isSaving: false, hasFinished: true }),
                error: () => patchState(store, { isSaving: false, error: 'saving' }),
              }),
            ),
        ),
      ),
    );

    const stepErrorFor = (step: OnboardingStep): OnboardingState['stepError'] => {
      if (step === 'oppositions' && !store.selectedIds().length) return 'noOpposition';
      if (step === 'schedule' && store.pendingOpposition()) return 'incompleteSchedule';
      return null;
    };

    const updateActiveSchedule = (update: (schedule: StudySchedule) => StudySchedule): void =>
      patchState(store, ({ schedules, activeScheduleId }) => ({
        schedules: updateSchedule(schedules, activeScheduleId, update),
      }));

    return {
      loadOppositions: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoadingOppositions: true, error: null })),
          switchMap(() =>
            onboardingService.getOppositions().pipe(
              tapResponse({
                next: (oppositions) =>
                  patchState(store, { oppositions, isLoadingOppositions: false }),
                error: () => patchState(store, { isLoadingOppositions: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      setHasInterfaceStep(hasInterfaceStep: boolean): void {
        patchState(store, { hasInterfaceStep });
      },
      toggleOpposition(id: string): void {
        patchState(store, ({ selectedIds, schedules, activeScheduleId }) => {
          const isSelected = selectedIds.includes(id);
          const nextIds = isSelected
            ? selectedIds.filter((selected) => selected !== id)
            : [...selectedIds, id];
          const nextSchedules = schedules[id]
            ? schedules
            : { ...schedules, [id]: initialSchedule(!Object.keys(schedules).length) };
          return {
            selectedIds: nextIds,
            schedules: nextSchedules,
            activeScheduleId:
              activeScheduleId && nextIds.includes(activeScheduleId)
                ? activeScheduleId
                : (nextIds[0] ?? null),
            stepError: null,
          };
        });
      },
      selectSchedule(activeScheduleId: string): void {
        patchState(store, { activeScheduleId });
      },
      toggleDay(day: number): void {
        updateActiveSchedule((schedule) => toggleScheduleDay(schedule, day));
      },
      addSlot(): void {
        updateActiveSchedule((schedule) => addScheduleSlot(schedule, DEFAULT_SLOTS[0].start));
      },
      removeSlot(index: number): void {
        updateActiveSchedule((schedule) => removeScheduleSlot(schedule, index));
      },
      updateSlot(index: number, part: keyof TimeSlot, value: string): void {
        updateActiveSchedule((schedule) => updateScheduleSlot(schedule, index, part, value));
      },
      setInterfaceMode(interfaceMode: InterfaceMode): void {
        patchState(store, { interfaceMode });
      },
      next(): void {
        const stepError = stepErrorFor(store.currentStep());
        if (stepError) {
          patchState(store, { stepError });
          return;
        }
        if (store.isLastStep()) {
          save();
          return;
        }
        patchState(store, ({ stepIndex }) => ({ stepIndex: stepIndex + 1, stepError: null }));
      },
      back(): void {
        patchState(store, ({ stepIndex }) => ({
          stepIndex: Math.max(0, stepIndex - 1),
          stepError: null,
        }));
      },
    };
  }),
);
