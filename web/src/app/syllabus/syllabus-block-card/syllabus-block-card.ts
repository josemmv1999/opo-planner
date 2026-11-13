import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { Icon } from '../../../common/components/icon/icon';
import { SyllabusBlock } from '../../../common/models/syllabus.model';
import { scoreBarClass } from '../../../common/utils/score-bar-class';

@Component({
  selector: 'app-syllabus-block-card',
  imports: [Button, RouterLink, TranslatePipe, Icon],
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

      @if (reviewCount()) {
        <button
          app-button
          variant="outline-primary"
          size="sm"
          type="button"
          class="syllabus-block-card__review align-self-start"
          icon="refresh"
          (click)="reviewed.emit()">
          {{ 'syllabus.reviewBlock' | translate: { count: reviewCount() } }}
        </button>
      }

      @if (isExpanded()) {
        <ul
          class="syllabus-block-card__topics list-unstyled mb-0"
          [id]="'block-topics-' + block().id">
          @for (topic of block().topics; track topic.id) {
            <li class="syllabus-block-card__topic d-flex align-items-center">
              <span class="syllabus-block-card__number">{{ topic.number }}</span>
              <span class="d-flex flex-column flex-grow-1 overflow-hidden">
                <a
                  class="syllabus-block-card__topic-link stretched-link fw-bold"
                  [routerLink]="['/syllabus', topic.id]"
                  >{{ topic.name }}</a
                >
                <span class="syllabus-block-card__facts d-flex flex-wrap align-items-center">
                  @if (topic.correctPercentage === null) {
                    <span>{{ 'syllabus.notPractised' | translate }}</span>
                  } @else {
                    <span class="d-flex align-items-center gap-1">
                      <span class="syllabus-block-card__mini-bar" aria-hidden="true">
                        <span [style.width.%]="topic.correctPercentage"></span>
                      </span>
                      {{
                        'syllabus.correctPercentage'
                          | translate: { percentage: topic.correctPercentage }
                      }}
                    </span>
                  }
                  <span [class.text-primary]="topic.notesCount > 0">
                    {{
                      (topic.notesCount ? 'syllabus.notesCount' : 'syllabus.noNotes')
                        | translate: { count: topic.notesCount }
                    }}
                  </span>
                </span>
              </span>
              <button
                type="button"
                class="syllabus-block-card__practice btn btn-outline-primary btn-sm d-flex align-items-center"
                (click)="practised.emit(topic.id)"
                [attr.aria-label]="'syllabus.practiceTopic' | translate: { number: topic.number }">
                <app-icon class="me-2" name="tests" />
                {{ 'syllabus.practice' | translate }}
              </button>
              <span class="syllabus-block-card__open d-flex align-items-center" aria-hidden="true">
                <span class="syllabus-block-card__open-label">{{
                  'syllabus.open' | translate
                }}</span>
                <app-icon name="chevron-right" />
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .syllabus-block-card__topic {
      position: relative;
      gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: 1rem;
      transition:
        border-color 0.12s,
        box-shadow 0.12s;

      &:hover,
      &:focus-within {
        border-color: var(--bs-dark);
        box-shadow: 0.25rem 0.25rem 0 var(--bs-primary);
      }

      & + & {
        margin-top: 0.625rem;
      }
    }

    .syllabus-block-card__number {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      font-weight: 900;
      background-color: var(--bs-light);
      border: 2px solid var(--bs-dark);
      border-radius: 0.75rem;
    }

    .syllabus-block-card__facts {
      gap: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--bs-secondary-color);
    }

    .syllabus-block-card__mini-bar {
      width: 3rem;
      height: 0.375rem;
      overflow: hidden;
      background-color: rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius-pill);

      span {
        display: block;
        height: 100%;
        background-color: var(--bs-primary);
      }
    }

    .syllabus-block-card__practice {
      position: relative;
      z-index: 2;
    }

    .syllabus-block-card__open {
      gap: 0.25rem;
      font-size: 0.875rem;
      font-weight: 900;
      color: var(--bs-primary);
      white-space: nowrap;
    }

    @container (max-width: 32rem) {
      .syllabus-block-card__open-label {
        display: none;
      }
    }

    :host {
      display: block;
      container-type: inline-size;
    }

    .syllabus-block-card__head {
      padding: 1rem 1.25rem;
    }

    .syllabus-block-card__review {
      margin: -0.25rem 1.25rem 1rem;
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
      text-decoration: none;

      &:hover {
        color: var(--bs-primary);
      }
    }

    .syllabus-block-card__topics {
      padding: 0 1.25rem 1rem;
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
  readonly reviewCount = input(0);
  readonly toggled = output();
  readonly studiedToggled = output();
  readonly practised = output<number>();
  readonly reviewed = output();

  protected readonly barClass = computed(() => scoreBarClass(this.block().correctPercentage ?? 0));
}
