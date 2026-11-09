import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { StudiedBlock } from '../../../common/models/home.model';

@Component({
  selector: 'app-studied-blocks-card',
  imports: [RouterLink, TranslatePipe, Icon],
  template: `
    <section class="card card--green h-100">
      <div class="card-body d-flex flex-column gap-3 p-3 p-lg-4">
        <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
          <h2 class="card-title studied-blocks-card__title mb-0">
            {{ 'home.blocks.studiedTitle' | translate }}
          </h2>
          @if (studiedBlocks().length) {
            <span class="studied-blocks-card__meta text-body-secondary">
              {{
                (studiedBlocks().length === 1
                  ? 'home.blocks.studiedCountOne'
                  : 'home.blocks.studiedCount'
                ) | translate: { count: studiedBlocks().length }
              }}
            </span>
          }
        </div>
        <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
          @for (block of studiedBlocks(); track block.id) {
            <li class="studied-blocks-card__row d-flex align-items-center gap-2 fw-semibold">
              <span
                class="studied-blocks-card__check d-flex align-items-center justify-content-center rounded-circle bg-success text-white">
                <app-icon name="check" />
              </span>
              {{ block.name }}
            </li>
          } @empty {
            <li class="text-body-secondary">{{ 'home.blocks.noStudied' | translate }}</li>
          }
        </ul>
        <a
          class="studied-blocks-card__link d-inline-flex align-items-center align-self-start mt-auto"
          routerLink="/syllabus">
          {{ 'home.blocks.seeSyllabus' | translate }}
          <app-icon class="ms-1" name="arrow-right" />
        </a>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .studied-blocks-card__title {
      font-size: 1.125rem;
    }

    .studied-blocks-card__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .studied-blocks-card__row {
      font-size: 0.875rem;
    }

    .studied-blocks-card__check {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;

      app-icon {
        width: 0.875rem;
        height: 0.875rem;
      }
    }

    .studied-blocks-card__link {
      min-height: 1.5rem;
      font-size: 0.875rem;
      font-weight: 800;

      app-icon {
        width: 1rem;
        height: 1rem;
      }
    }

    @container (min-width: 30rem) {
      .studied-blocks-card__title {
        font-size: 1.25rem;
      }

      .studied-blocks-card__row {
        font-size: 0.9375rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudiedBlocksCard {
  readonly studiedBlocks = input.required<StudiedBlock[]>();
}
