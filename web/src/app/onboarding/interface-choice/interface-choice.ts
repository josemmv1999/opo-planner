import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { InterfaceMode } from '../../../common/models/onboarding.model';

@Component({
  selector: 'app-interface-choice',
  imports: [TranslatePipe, Icon],
  template: `
    <fieldset class="interface-choice m-0 p-0 border-0">
      <legend class="visually-hidden">{{ 'onboarding.interface.label' | translate }}</legend>
      @for (option of options; track option) {
        <label class="choice-card choice-card--cyan">
          <input
            class="visually-hidden"
            type="radio"
            name="interface-mode"
            [value]="option"
            [checked]="mode() === option"
            (change)="changed.emit(option)" />
          <span
            class="interface-choice__preview d-flex align-items-center justify-content-center"
            aria-hidden="true">
            @if (option === 'desktop') {
              <span class="interface-choice__desktop">
                <span class="interface-choice__side">
                  @for (line of lines; track $index) {
                    <span></span>
                  }
                </span>
                <span class="interface-choice__main">
                  <span></span><span></span><span></span><span></span>
                </span>
              </span>
            } @else {
              <span class="interface-choice__phone">
                <span></span><span></span><span></span>
                <span class="interface-choice__tabbar">
                  @for (dot of dots; track $index) {
                    <span></span>
                  }
                </span>
              </span>
            }
          </span>
          <span class="d-flex align-items-center justify-content-between gap-2">
            <span class="interface-choice__title">{{
              'onboarding.interface.' + option | translate
            }}</span>
            <span class="choice-card__tick" aria-hidden="true"><app-icon name="check" /></span>
          </span>
          <span class="interface-choice__hint text-body-secondary">
            {{ 'onboarding.interface.' + option + 'Hint' | translate }}
          </span>
        </label>
      }
    </fieldset>
  `,
  styles: `
    .interface-choice {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: 1.25rem;
    }

    .interface-choice__preview {
      height: 10rem;
    }

    .interface-choice__desktop {
      display: grid;
      grid-template-columns: 5.5rem 1fr;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: var(--bs-light);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius);
    }

    .interface-choice__side {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0.625rem;
      background-color: var(--bs-white);
      border-right: 2px solid var(--bs-dark);

      span {
        height: 0.4375rem;
        background-color: rgba(var(--bs-dark-rgb), 0.16);
        border-radius: var(--bs-border-radius-pill);
      }

      span:first-child {
        background-color: var(--bs-primary);
      }
    }

    .interface-choice__main {
      display: grid;
      grid-template-columns: 1fr 1fr 0.9fr;
      grid-template-rows: 1fr 1fr;
      gap: 0.5rem;
      padding: 0.625rem;

      span {
        background-color: var(--bs-white);
        border: 1.5px solid var(--bs-dark);
        border-radius: 0.375rem;
      }

      span:first-child {
        background-color: var(--bs-primary);
      }

      span:nth-child(3) {
        grid-row: span 2;
      }

      span:nth-child(4) {
        grid-column: span 2;
      }
    }

    .interface-choice__phone {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      width: 5.75rem;
      height: 100%;
      padding: 0.5rem;
      background-color: var(--bs-light);
      border: 2px solid var(--bs-dark);
      border-radius: 1rem;

      > span:not(.interface-choice__tabbar) {
        height: 1.75rem;
        background-color: var(--bs-white);
        border: 1.5px solid var(--bs-dark);
        border-radius: 0.375rem;
      }

      > span:first-child {
        background-color: var(--bs-primary);
      }
    }

    .interface-choice__tabbar {
      display: flex;
      justify-content: space-around;
      margin-top: auto;
      padding-top: 0.375rem;
      border-top: 1.5px solid var(--bs-dark);

      span {
        width: 0.375rem;
        height: 0.375rem;
        background-color: rgba(var(--bs-dark-rgb), 0.16);
        border-radius: 50%;
      }

      span:first-child {
        background-color: var(--bs-primary);
      }
    }

    .interface-choice__title {
      font-size: 1.1875rem;
      font-weight: 800;
    }

    .interface-choice__hint {
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceChoice {
  readonly mode = input.required<InterfaceMode>();
  readonly changed = output<InterfaceMode>();

  protected readonly options: InterfaceMode[] = ['desktop', 'touch'];
  protected readonly lines = Array.from({ length: 5 });
  protected readonly dots = Array.from({ length: 4 });
}
