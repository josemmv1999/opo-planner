import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { SyllabusBlock } from '../../../common/models/syllabus.model';
import { scoreBarClass } from '../../../common/utils/score-bar-class';

@Component({
  selector: 'app-syllabus-block-card',
  imports: [RouterLink, TranslatePipe, Icon],
  template: `
    <section
      class="card h-100"
      [class.card--teal]="!block().isStudied"
      [class.card--green]="block().isStudied">
      <div class="syllabus-block-card__head d-flex align-items-center gap-3">
        <button
          type="button"
          class="syllabus-block-card__toggle d-flex align-items-center gap-3 flex-grow-1 text-start"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="'block-topics-' + block().id"
          (click)="toggled.emit()">
          <app-icon class="syllabus-block-card__chevron" name="chevron-right" />
          <span class="d-flex flex-column gap-1 flex-grow-1 overflow-hidden">
            <span class="syllabus-block-card__label text-body-secondary">
              {{ block().label }} ·
              {{ 'syllabus.topicCount' | translate: { count: block().topics.length } }}
            </span>
            <span class="syllabus-block-card__name">{{ block().name }}</span>
            <span
              class="d-flex align-items-center gap-2 syllabus-block-card__score text-body-secondary">
              @let percentage = block().correctPercentage;
              @if (percentage !== null) {
                <span class="syllabus-block-card__bar progress" aria-hidden="true">
                  <span
                    class="progress-bar"
                    [class]="barClass()"
                    [style.width.%]="percentage"></span>
                </span>
                {{ 'syllabus.correctPercentage' | translate: { percentage } }}
              } @else {
                {{ 'syllabus.noData' | translate }}
              }
            </span>
          </span>
        </button>
        <button
          type="button"
          class="syllabus-block-card__studied d-flex align-items-center"
          [class.syllabus-block-card__studied--on]="block().isStudied"
          [attr.aria-pressed]="block().isStudied"
          [disabled]="isUpdating()"
          (click)="studiedToggled.emit()">
          <span
            class="syllabus-block-card__box d-flex align-items-center justify-content-center me-2">
            <app-icon name="check" />
          </span>
          {{ (block().isStudied ? 'syllabus.studied' : 'syllabus.markStudied') | translate }}
        </button>
      </div>

      @if (isExpanded()) {
        <ul
          class="syllabus-block-card__topics list-unstyled mb-0"
          [id]="'block-topics-' + block().id">
          @for (topic of block().topics; track topic.id) {
            <li class="syllabus-block-card__topic d-flex align-items-center gap-3">
              <span class="d-flex flex-column flex-grow-1 overflow-hidden">
                <a
                  class="syllabus-block-card__topic-link fw-bold"
                  [routerLink]="['/syllabus', topic.id]"
                  >{{
                    'syllabus.topicName' | translate: { number: topic.number, name: topic.name }
                  }}</a
                >
                <span class="syllabus-block-card__meta text-body-secondary">
                  {{
                    topic.correctPercentage === null
                      ? ('syllabus.notPractised' | translate)
                      : ('syllabus.correctPercentage'
                        | translate: { percentage: topic.correctPercentage })
                  }}
                  · {{ 'syllabus.notesCount' | translate: { count: topic.notesCount } }}
                </span>
              </span>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm d-flex align-items-center"
                (click)="practised.emit(topic.id)"
                [attr.aria-label]="'syllabus.practiceTopic' | translate: { number: topic.number }">
                <app-icon class="me-2" name="tests" />
                {{ 'syllabus.practice' | translate }}
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .syllabus-block-card__head {
      padding: 1rem 1.25rem;
    }

    .syllabus-block-card__toggle {
      min-width: 0;
      padding: 0;
      color: inherit;
      background: none;
      border: 0;
    }

    .syllabus-block-card__chevron {
      transition: transform 0.2s ease;

      [aria-expanded='true'] > & {
        transform: rotate(90deg);
      }
    }

    .syllabus-block-card__label {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .syllabus-block-card__name {
      font-size: 1.0625rem;
      font-weight: 900;
    }

    .syllabus-block-card__score,
    .syllabus-block-card__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .syllabus-block-card__bar {
      --bs-progress-height: 0.5rem;
      --bs-progress-bg: rgba(var(--bs-dark-rgb), 0.08);
      --bs-progress-border-radius: var(--bs-border-radius-pill);
      width: 10rem;
      max-width: 40%;
      border: 1.5px solid var(--bs-dark);
    }

    .syllabus-block-card__studied {
      flex-shrink: 0;
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 800;
      white-space: nowrap;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius-pill);
    }

    .syllabus-block-card__box {
      width: 1.125rem;
      height: 1.125rem;
      color: transparent;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: 0.375rem;

      app-icon {
        width: 0.75rem;
        height: 0.75rem;
      }
    }

    .syllabus-block-card__studied--on {
      color: var(--bs-success);
      background-color: rgba(var(--bs-success-rgb), 0.08);
      border-color: var(--bs-success);

      .syllabus-block-card__box {
        color: var(--bs-white);
        background-color: var(--bs-success);
        border-color: var(--bs-success);
      }
    }

    .syllabus-block-card__topic-link {
      color: var(--bs-body-color);

      &:hover {
        color: var(--bs-primary);
      }
    }

    .syllabus-block-card__topics {
      padding: 0 1.25rem 1rem;
    }

    .syllabus-block-card__topic {
      padding: 0.75rem 0;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.14);
    }

    @container (max-width: 34rem) {
      .syllabus-block-card__head {
        flex-wrap: wrap;
      }

      .syllabus-block-card__studied {
        margin-left: 2.25rem;
      }

      .syllabus-block-card__topic {
        flex-wrap: wrap;
        gap: 0.5rem !important;

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .syllabus-block-card__chevron {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyllabusBlockCard {
  readonly block = input.required<SyllabusBlock>();
  readonly isExpanded = input(false);
  readonly isUpdating = input(false);
  readonly toggled = output();
  readonly studiedToggled = output();
  readonly practised = output<number>();

  protected readonly barClass = computed(() => scoreBarClass(this.block().correctPercentage ?? 0));
}
