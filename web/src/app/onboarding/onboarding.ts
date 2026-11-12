import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { InterfaceChoice } from './interface-choice/interface-choice';
import { OnboardingStepper } from './onboarding-stepper/onboarding-stepper';
import { OnboardingStore } from './onboarding.store';
import { OppositionChoices } from './opposition-choices/opposition-choices';
import { ScheduleEditor } from './schedule-editor/schedule-editor';

const DESKTOP_QUERY = '(pointer: fine) and (min-width: 62rem)';

interface Hint {
  key: string;
  params?: object;
  isError: boolean;
}

@Component({
  selector: 'app-onboarding',
  imports: [
    Button,
    TranslatePipe,
    Icon,
    OnboardingStepper,
    OppositionChoices,
    ScheduleEditor,
    InterfaceChoice,
  ],
  providers: [OnboardingStore],
  host: { class: 'd-flex flex-column min-vh-100' },
  template: `
    <header class="onboarding__top d-flex align-items-center justify-content-between gap-3">
      <img
        class="onboarding__logo"
        src="/brand/logo.svg"
        [alt]="'onboarding.logoAlt' | translate" />
      <span class="onboarding__step-count text-body-secondary">
        {{
          'onboarding.stepCount'
            | translate: { current: store.stepIndex() + 1, total: store.steps().length }
        }}
      </span>
    </header>

    <main class="onboarding__content d-flex flex-column gap-4 w-100 mx-auto">
      <app-onboarding-stepper [steps]="store.steps()" [currentIndex]="store.stepIndex()" />

      <div class="d-flex flex-column gap-2">
        <h1 #heading class="onboarding__title mb-0" tabindex="-1">
          {{ 'onboarding.' + store.currentStep() + '.title' | translate }}
        </h1>
        <p class="onboarding__lead text-body-secondary mb-0">
          {{ 'onboarding.' + store.currentStep() + '.lead' | translate }}
        </p>
      </div>

      @switch (store.currentStep()) {
        @case ('oppositions') {
          @if (store.isLoadingOppositions()) {
            <div class="d-flex justify-content-center py-5">
              <span class="spinner-border text-primary" role="status"></span>
            </div>
          } @else if (store.error() === 'loading') {
            <div class="alert alert-danger mb-0" role="alert">
              {{ 'onboarding.oppositions.loadError' | translate }}
            </div>
          } @else {
            <app-opposition-choices
              [oppositions]="store.oppositions()"
              [selectedIds]="store.selectedIds()"
              (toggled)="store.toggleOpposition($event)" />
          }
        }
        @case ('schedule') {
          @if (store.activeSchedule(); as schedule) {
            <app-schedule-editor
              [oppositions]="store.selectedOppositions()"
              [activeId]="store.activeScheduleId()"
              [completedIds]="store.completedScheduleIds()"
              [schedule]="schedule"
              [issues]="store.activeSlotIssues()"
              [clashes]="store.activeSlotClashes()"
              [weeklyHours]="store.activeWeeklyHours()"
              (scheduleSelected)="store.selectSchedule($event)"
              (dayToggled)="store.toggleDay($event)"
              (slotAdded)="store.addSlot()"
              (slotRemoved)="store.removeSlot($event)"
              (slotChanged)="store.updateSlot($event.index, $event.part, $event.value)" />
          }
        }
        @case ('interface') {
          <app-interface-choice
            [mode]="store.interfaceMode()"
            (changed)="store.setInterfaceMode($event)" />
        }
      }

      <div class="d-flex flex-wrap align-items-center gap-3">
        @if (store.stepIndex() > 0) {
          <button
            app-button
            variant="outline-primary"
            type="button"
            (click)="back()"
            icon="chevron-left">
            {{ 'actions.back' | translate }}
          </button>
        }
        <div class="d-flex align-items-center justify-content-end gap-3 ms-auto">
          <p class="onboarding__hint mb-0" [class.text-danger]="hint()?.isError" aria-live="polite">
            @if (hint(); as hint) {
              {{ hint.key | translate: hint.params }}
            }
          </p>
          <button
            app-button
            type="button"
            class="d-flex align-items-center"
            [isLoading]="store.isSaving()"
            [disabled]="store.isSaving()"
            (click)="next()">
            {{ (store.isLastStep() ? 'actions.start' : 'actions.next') | translate }}
            <app-icon class="ms-2" name="arrow-right" />
          </button>
        </div>
      </div>
    </main>
  `,
  styles: `
    .onboarding__top {
      padding: 1.25rem 2rem;
    }

    .onboarding__logo {
      height: 2.25rem;
    }

    .onboarding__step-count {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .onboarding__content {
      max-width: 50rem;
      padding: 0.5rem 1rem 3rem;
    }

    .onboarding__title {
      font-size: clamp(1.625rem, 4vw, 2.125rem);
      font-weight: 900;
      line-height: 1.15;

      &:focus {
        outline: none;
      }
    }

    .onboarding__lead {
      font-size: 1.0625rem;
    }

    .onboarding__hint {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--bs-secondary-color);
    }

    @media (max-width: 575.98px) {
      .onboarding__top {
        padding: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Onboarding {
  protected readonly store = inject(OnboardingStore);
  readonly #router = inject(Router);
  readonly #injector = inject(Injector);
  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  protected readonly hint = computed<Hint | null>(() => {
    const pending = this.store.pendingOpposition();
    if (this.store.error() === 'saving') return { key: 'onboarding.errors.saving', isError: true };
    if (this.store.stepError() === 'noOpposition')
      return { key: 'onboarding.errors.noOpposition', isError: true };
    if (this.store.stepError() === 'incompleteSchedule' && pending) {
      return this.store.selectedIds().length > 1
        ? {
            key: 'onboarding.errors.incompleteSchedule',
            params: { name: pending.name },
            isError: true,
          }
        : { key: 'onboarding.errors.incompleteScheduleOne', isError: true };
    }
    if (this.store.currentStep() !== 'oppositions') return null;
    const count = this.store.selectedIds().length;
    return {
      key: count === 1 ? 'onboarding.oppositions.chosenOne' : 'onboarding.oppositions.chosen',
      params: { count },
      isError: false,
    };
  });

  constructor() {
    this.store.setHasInterfaceStep(matchMedia(DESKTOP_QUERY).matches);
    this.store.loadOppositions();
    effect(() => this.store.hasFinished() && this.#router.navigate(['/home']));
  }

  protected next(): void {
    this.#moveStep(() => this.store.next());
  }

  protected back(): void {
    this.#moveStep(() => this.store.back());
  }

  #moveStep(move: () => void): void {
    const previousIndex = this.store.stepIndex();
    move();
    if (this.store.stepIndex() !== previousIndex) {
      afterNextRender(() => this.heading().nativeElement.focus(), { injector: this.#injector });
    }
  }
}
