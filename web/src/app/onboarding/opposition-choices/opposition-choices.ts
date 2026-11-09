import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { OppositionOption } from '../../../common/models/onboarding.model';

@Component({
  selector: 'app-opposition-choices',
  imports: [TranslatePipe, Icon],
  template: `
    <fieldset class="opposition-choices m-0 p-0 border-0">
      <legend class="visually-hidden">{{ 'onboarding.oppositions.label' | translate }}</legend>
      @for (opposition of oppositions(); track opposition.id) {
        <label class="choice-card">
          <input
            class="visually-hidden"
            type="checkbox"
            [checked]="selectedIds().includes(opposition.id)"
            (change)="toggled.emit(opposition.id)" />
          <span class="d-flex align-items-center justify-content-between gap-2">
            <span
              class="opposition-choices__level"
              [class.bg-info]="opposition.level === 'C1'"
              [class.bg-secondary]="opposition.level === 'C2'">
              {{ opposition.level }}
            </span>
            <span class="choice-card__tick" aria-hidden="true"><app-icon name="check" /></span>
          </span>
          <span class="opposition-choices__name">{{ opposition.name }}</span>
          <span class="opposition-choices__body text-body-secondary">{{ opposition.body }}</span>
        </label>
      }
    </fieldset>
  `,
  styles: `
    .opposition-choices {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: 1.25rem;
    }

    .opposition-choices__level {
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 900;
      color: var(--bs-dark);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-sm);
    }

    .opposition-choices__name {
      font-size: 1.1875rem;
      font-weight: 800;
      line-height: 1.25;
    }

    .opposition-choices__body {
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OppositionChoices {
  readonly oppositions = input.required<OppositionOption[]>();
  readonly selectedIds = input.required<string[]>();
  readonly toggled = output<string>();
}
