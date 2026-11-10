import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { WeakBlock } from '../../../common/models/home.model';
import { scoreBarClass } from '../../../common/utils/score-bar-class';

@Component({
  selector: 'app-weak-blocks-card',
  imports: [RouterLink, TranslatePipe, Icon],
  template: `
    <section class="card h-100">
      <div class="card-body card-body--home d-flex flex-column gap-3">
        <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
          <h2 class="card-title weak-blocks-card__title mb-0">
            {{ 'home.blocks.weakTitle' | translate }}
          </h2>
          <span class="weak-blocks-card__meta text-body-secondary">{{
            'home.blocks.weakMeta' | translate
          }}</span>
        </div>
        <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
          @for (block of weakBlocksWithColor(); track block.id) {
            <li class="d-flex align-items-center gap-3">
              <div class="d-flex flex-column gap-1 flex-grow-1 overflow-hidden">
                <div class="weak-blocks-card__row d-flex justify-content-between gap-2">
                  <span class="fw-bold">{{ block.name }}</span>
                  <span class="weak-blocks-card__percentage text-nowrap">
                    {{
                      'home.blocks.percentage' | translate: { percentage: block.correctPercentage }
                    }}
                  </span>
                </div>
                <div
                  class="weak-blocks-card__bar progress"
                  role="progressbar"
                  [attr.aria-label]="block.name"
                  [attr.aria-valuenow]="block.correctPercentage"
                  aria-valuemin="0"
                  aria-valuemax="100">
                  <div
                    [class]="'progress-bar ' + block.barColor"
                    [style.width.%]="block.correctPercentage"></div>
                </div>
              </div>
              <a
                class="weak-blocks-card__practice btn btn-outline-primary"
                routerLink="/syllabus"
                [title]="'home.blocks.practice' | translate"
                [attr.aria-label]="'home.blocks.practiceBlock' | translate: { name: block.name }">
                <span class="weak-blocks-card__practice-text">{{
                  'home.blocks.practice' | translate
                }}</span>
                <app-icon class="weak-blocks-card__practice-icon" name="arrow-right" />
              </a>
            </li>
          } @empty {
            <li class="text-body-secondary">{{ 'home.blocks.noWeak' | translate }}</li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .weak-blocks-card__title {
      font-size: 1.125rem;
    }

    .weak-blocks-card__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .weak-blocks-card__row {
      font-size: 0.875rem;
    }

    .weak-blocks-card__percentage {
      font-weight: 800;
    }

    .weak-blocks-card__bar {
      --bs-progress-height: 0.625rem;
      --bs-progress-bg: rgba(var(--bs-dark-rgb), 0.1);
      --bs-progress-border-radius: var(--bs-border-radius-pill);
      border: 1.5px solid var(--bs-dark);
    }

    .weak-blocks-card__practice {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      padding: 0;
    }

    .weak-blocks-card__practice-text {
      display: none;
    }

    @container (min-width: 30rem) {
      .weak-blocks-card__title {
        font-size: 1.25rem;
      }

      .weak-blocks-card__meta {
        font-size: 0.875rem;
      }

      .weak-blocks-card__row {
        font-size: 0.9375rem;
      }

      .weak-blocks-card__practice {
        width: auto;
        height: auto;
        padding: 0.5rem 0.875rem;
        font-size: 0.875rem;
        font-weight: 800;
        border-radius: 0.625rem;
      }

      .weak-blocks-card__practice-text {
        display: inline;
      }

      .weak-blocks-card__practice-icon {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeakBlocksCard {
  readonly weakBlocks = input.required<WeakBlock[]>();

  protected readonly weakBlocksWithColor = computed(() =>
    this.weakBlocks().map((block) => ({ ...block, barColor: scoreBarClass(block.correctPercentage) })),
  );
}
