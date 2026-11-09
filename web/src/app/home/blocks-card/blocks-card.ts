import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { StudiedBlock, WeakBlock } from '../../../common/models/home.model';

const barColor = (percentage: number): string => {
  if (percentage < 50) return 'bg-danger';
  if (percentage < 60) return 'bg-secondary';
  return 'bg-warning';
};

@Component({
  selector: 'app-blocks-card',
  imports: [RouterLink, TranslatePipe, Icon],
  template: `
    <section class="card card--teal h-100">
      <div class="card-body d-flex flex-column gap-3 p-3 p-lg-4">
        <h2 class="card-title blocks-card__title mb-0">{{ 'home.blocks.title' | translate }}</h2>
        <div class="blocks-card__columns">
          <div class="blocks-card__weak d-flex flex-column gap-3">
            <h3 class="blocks-card__subtitle">{{ 'home.blocks.weak' | translate }}</h3>
            @for (block of weakBlocksWithColor(); track block.id) {
              <div class="d-flex align-items-center gap-3">
                <div class="d-flex flex-column gap-1 flex-grow-1 overflow-hidden">
                  <div class="blocks-card__row d-flex justify-content-between gap-2">
                    <span class="fw-bold">{{ block.name }}</span>
                    <span class="blocks-card__percentage text-nowrap">
                      {{ 'home.blocks.percentage' | translate: { percentage: block.correctPercentage } }}
                    </span>
                  </div>
                  <div
                    class="blocks-card__bar progress"
                    role="progressbar"
                    [attr.aria-label]="block.name"
                    [attr.aria-valuenow]="block.correctPercentage"
                    aria-valuemin="0"
                    aria-valuemax="100">
                    <div [class]="'progress-bar ' + block.barColor" [style.width.%]="block.correctPercentage"></div>
                  </div>
                </div>
                <a
                  class="blocks-card__practice btn btn-outline-primary"
                  routerLink="/mock-exams"
                  [queryParams]="{ block: block.id }"
                  [title]="'home.blocks.practice' | translate"
                  [attr.aria-label]="'home.blocks.practiceBlock' | translate: { name: block.name }">
                  <span class="blocks-card__practice-text">{{ 'home.blocks.practice' | translate }}</span>
                  <app-icon class="blocks-card__practice-icon" name="arrow-right" />
                </a>
              </div>
            } @empty {
              <p class="text-body-secondary mb-0">{{ 'home.blocks.noWeak' | translate }}</p>
            }
          </div>
          <div class="blocks-card__studied d-flex flex-column gap-2">
            <h3 class="blocks-card__subtitle">{{ 'home.blocks.studied' | translate }}</h3>
            <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
              @for (block of studiedBlocks(); track block.id) {
                <li class="blocks-card__row d-flex align-items-center gap-2 fw-semibold">
                  <span
                    class="blocks-card__check d-flex align-items-center justify-content-center rounded-circle bg-success text-white">
                    <app-icon name="check" />
                  </span>
                  {{ block.name }}
                </li>
              } @empty {
                <li class="text-body-secondary">{{ 'home.blocks.noStudied' | translate }}</li>
              }
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .blocks-card__title {
      font-size: 1.125rem;
    }

    .blocks-card__columns {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .blocks-card__subtitle {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--bs-secondary-color);
    }

    .blocks-card__row {
      font-size: 0.875rem;
    }

    .blocks-card__percentage {
      font-weight: 800;
    }

    .blocks-card__bar {
      --bs-progress-height: 0.625rem;
      --bs-progress-bg: rgba(var(--bs-dark-rgb), 0.1);
      --bs-progress-border-radius: var(--bs-border-radius-pill);
      border: 1.5px solid var(--bs-dark);
    }

    .blocks-card__practice {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      padding: 0;
    }

    .blocks-card__practice-text {
      display: none;
    }

    .blocks-card__studied {
      padding-top: 0.75rem;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.12);
    }

    .blocks-card__check {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;

      app-icon {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    @container (min-width: 30rem) {
      .blocks-card__title {
        font-size: 1.25rem;
      }

      .blocks-card__row {
        font-size: 0.9375rem;
      }

      .blocks-card__practice {
        width: auto;
        height: auto;
        padding: 0.5rem 0.875rem;
        font-size: 0.875rem;
        font-weight: 800;
        border-radius: 0.625rem;
      }

      .blocks-card__practice-text {
        display: inline;
      }

      .blocks-card__practice-icon {
        display: none;
      }
    }

    @container (min-width: 44rem) {
      .blocks-card__columns {
        flex-direction: row;
        gap: 2rem;
      }

      .blocks-card__weak {
        flex: 2 1 0;
        min-width: 0;
      }

      .blocks-card__studied {
        flex: 1 1 0;
        min-width: 0;
        padding-top: 0;
        padding-left: 1.5rem;
        border-top: 0;
        border-left: 2px dashed rgba(var(--bs-dark-rgb), 0.12);
      }

      .blocks-card__subtitle {
        font-size: 0.9375rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksCard {
  readonly studiedBlocks = input.required<StudiedBlock[]>();
  readonly weakBlocks = input.required<WeakBlock[]>();

  protected readonly weakBlocksWithColor = computed(() =>
    this.weakBlocks().map((block) => ({ ...block, barColor: barColor(block.correctPercentage) })),
  );
}
