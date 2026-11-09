import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { OnboardingStep } from '../onboarding.store';

@Component({
  selector: 'app-onboarding-stepper',
  imports: [TranslatePipe, Icon],
  template: `
    <ol
      class="onboarding-stepper list-unstyled d-flex align-items-center gap-2 mb-0"
      [attr.aria-label]="'onboarding.stepsLabel' | translate">
      @for (step of steps(); track step; let i = $index) {
        <li
          class="onboarding-stepper__step d-flex align-items-center gap-2"
          [class.onboarding-stepper__step--done]="i < currentIndex()"
          [attr.aria-current]="i === currentIndex() ? 'step' : null">
          <span
            class="onboarding-stepper__dot d-flex align-items-center justify-content-center rounded-circle">
            @if (i < currentIndex()) {
              <app-icon name="check" />
              <span class="visually-hidden">{{ 'onboarding.stepDone' | translate }}</span>
            } @else {
              {{ i + 1 }}
            }
          </span>
          <span class="onboarding-stepper__label">{{
            'onboarding.steps.' + step | translate
          }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .onboarding-stepper__step {
      font-weight: 800;
      color: var(--bs-secondary-color);
      white-space: nowrap;

      &:not(:last-child) {
        flex: 1;

        &::after {
          content: '';
          flex: 1;
          min-width: 1.5rem;
          height: 0.1875rem;
          background-color: rgba(var(--bs-dark-rgb), 0.16);
          border-radius: var(--bs-border-radius-pill);
        }
      }

      &[aria-current='step'],
      &--done {
        color: var(--bs-body-color);
      }

      &--done::after {
        background-color: var(--bs-primary) !important;
      }
    }

    .onboarding-stepper__dot {
      flex-shrink: 0;
      width: 2.125rem;
      height: 2.125rem;
      font-size: 0.875rem;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.16);

      app-icon {
        width: 1rem;
        height: 1rem;
      }

      [aria-current='step'] > & {
        background-color: var(--bs-warning);
        border-color: var(--bs-dark);
      }

      .onboarding-stepper__step--done > & {
        color: var(--bs-white);
        background-color: var(--bs-primary);
        border-color: var(--bs-dark);
      }
    }

    @media (max-width: 575.98px) {
      .onboarding-stepper__step:not([aria-current='step']) .onboarding-stepper__label {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingStepper {
  readonly steps = input.required<OnboardingStep[]>();
  readonly currentIndex = input.required<number>();
}
