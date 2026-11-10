import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Opposition } from '../../models/opposition.model';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-page-header',
  imports: [NgTemplateOutlet, TranslatePipe, Icon],
  host: { class: 'd-flex align-items-start justify-content-between gap-3' },
  template: `
    <ng-template #selector>
      @if (oppositionNameParts(); as name) {
        <button
          type="button"
          class="page-header__selector text-start p-0 border-0 bg-transparent"
          [title]="'appLayout.changeOpposition' | translate">
          {{ name.start }}<span class="text-nowrap">{{ name.lastWord }}<app-icon class="page-header__arrow text-primary ms-1 d-lg-none" name="chevron-down" /></span>
        </button>
      }
    </ng-template>

    <div class="d-flex flex-column gap-1 overflow-hidden">
      @if (isHome()) {
        <p class="page-header__eyebrow">{{ greeting() }}</p>
        <h1 class="page-header__title"><ng-container [ngTemplateOutlet]="selector" /></h1>
      } @else {
        <p class="page-header__eyebrow"><ng-container [ngTemplateOutlet]="selector" /></p>
        <h1 class="page-header__title">{{ title() }}</h1>
      }
    </div>
  `,
  styles: `
    .page-header__eyebrow {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--bs-secondary-color);
    }

    .page-header__title {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 800;
      line-height: 1.2;
    }

    .page-header__selector {
      font: inherit;
      color: inherit;
    }

    .page-header__arrow {
      vertical-align: -0.125rem;
    }

    @media (min-width: 992px) {
      .page-header__eyebrow {
        font-size: 1rem;
      }

      .page-header__title {
        font-size: 2rem;
      }
    }

    @media (min-width: 992px) and (max-height: 56rem) {
      .page-header__title {
        font-size: 1.625rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly isHome = input(false);
  readonly greeting = input('');
  readonly title = input('');
  readonly opposition = input.required<Opposition | null>();

  protected readonly oppositionNameParts = computed(() => {
    const name = this.opposition()?.name;
    if (!name) return null;
    const lastSpace = name.lastIndexOf(' ');
    return { start: name.slice(0, lastSpace + 1), lastWord: name.slice(lastSpace + 1) };
  });
}
