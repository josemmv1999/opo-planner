import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { WeakBlock } from '../../../common/models/exam.model';
import { CountdownPipe } from '../../../common/pipes/countdown.pipe';

@Component({
  selector: 'app-exam-result',
  imports: [RouterLink, TranslatePipe, Icon, CountdownPipe],
  template: `
    <section class="card card--green">
      <div class="card-body d-flex flex-column gap-4">
        <div>
          <p class="exam-result__eyebrow text-body-secondary mb-1">{{ name() }}</p>
          <h1 class="exam-result__title mb-0">{{ 'examResult.title' | translate }}</h1>
        </div>

        <div class="exam-result__kpis">
          <div class="exam-result__kpi d-flex flex-column">
            <strong>{{ correct() }}/{{ total() }}</strong>
            <span>{{ 'examResult.correct' | translate: { percentage: percentage() } }}</span>
          </div>
          <div class="exam-result__kpi d-flex flex-column">
            <strong>{{ wrong() }}</strong>
            <span>{{ 'examResult.wrong' | translate }}</span>
          </div>
          <div class="exam-result__kpi d-flex flex-column">
            <strong>{{ blank() }}</strong>
            <span>{{ 'examResult.blank' | translate }}</span>
          </div>
          <div class="exam-result__kpi d-flex flex-column">
            <strong>{{ secondsTaken() | countdown }}</strong>
            <span>
              {{ 'examResult.time' | translate: { seconds: secondsPerQuestion() } }}
            </span>
          </div>
        </div>

        @if (weakBlocks().length) {
          <div class="d-flex flex-column gap-3">
            <h2 class="exam-result__section mb-0">{{ 'examResult.practise' | translate }}</h2>
            <ul class="list-unstyled mb-0">
              @for (block of weakBlocks(); track block.name) {
                <li class="exam-result__block d-flex flex-wrap align-items-center">
                  <span class="d-flex flex-column flex-grow-1">
                    <span class="fw-bold">{{ block.name }}</span>
                    <span class="exam-result__meta text-body-secondary">
                      {{ 'examResult.error' | translate: { percentage: block.errorPercentage } }}
                    </span>
                  </span>
                  <span class="exam-result__bar" aria-hidden="true">
                    <span [style.width.%]="block.errorPercentage"></span>
                  </span>
                  <a class="btn btn-outline-primary btn-sm" routerLink="/syllabus">
                    {{ 'examResult.practiseAction' | translate }}
                  </a>
                </li>
              }
            </ul>
          </div>
        }

        <div class="d-flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-primary d-flex align-items-center"
            (click)="reviewed.emit()">
            <app-icon class="me-2" name="eye" />
            {{ 'examResult.review' | translate }}
          </button>
          <a class="btn btn-outline-primary" routerLink="/exams">
            {{ 'examResult.backToExams' | translate }}
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      container-type: inline-size;
    }

    .exam-result__eyebrow {
      font-size: 0.875rem;
      font-weight: 800;
    }

    .exam-result__title {
      font-size: 1.5rem;
      font-weight: 900;
    }

    .exam-result__kpis {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;

      @container (min-width: 40rem) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .exam-result__kpi {
      gap: 0.125rem;
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      font-weight: 700;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);

      strong {
        font-size: 1.75rem;
        font-weight: 900;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }
    }

    .exam-result__section {
      font-size: 1.125rem;
      font-weight: 900;
    }

    .exam-result__block {
      gap: 0.75rem 1rem;
      padding: 0.75rem 0;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.14);

      &:first-child {
        padding-top: 0;
        border-top: 0;
      }
    }

    .exam-result__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .exam-result__bar {
      flex: 0 0 6rem;
      height: 0.625rem;
      overflow: hidden;
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);

      span {
        display: block;
        height: 100%;
        background-color: var(--bs-danger);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamResult {
  readonly name = input.required<string>();
  readonly correct = input.required<number>();
  readonly total = input.required<number>();
  readonly percentage = input.required<number>();
  readonly wrong = input.required<number>();
  readonly blank = input.required<number>();
  readonly secondsTaken = input.required<number>();
  readonly secondsPerQuestion = input.required<number>();
  readonly weakBlocks = input.required<WeakBlock[]>();
  readonly reviewed = output();
}
