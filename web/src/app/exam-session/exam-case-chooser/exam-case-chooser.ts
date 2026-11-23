import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { ExamCase } from '../../../common/models/exam.model';

@Component({
  selector: 'app-exam-case-chooser',
  imports: [Button, TranslatePipe],
  template: `
    <section class="card card--cyan h-100">
      <div class="card-body d-flex flex-column gap-4">
        <div class="d-flex flex-column gap-1">
          <h1 class="exam-case-chooser__title mb-0">
            {{ 'examSession.chooseCase' | translate }}
          </h1>
          <p class="text-body-secondary mb-0">{{ 'examSession.chooseCaseHint' | translate }}</p>
        </div>

        @for (examCase of cases(); track examCase.section) {
          <article class="exam-case-chooser__case d-flex flex-column gap-3">
            <h2 class="h6 mb-0">{{ examCase.section }}</h2>
            <p class="exam-case-chooser__text mb-0">{{ examCase.text }}</p>
            <button
              app-button
              type="button"
              class="align-self-start"
              (click)="chosen.emit(examCase.section)">
              {{ 'examSession.chooseThisCase' | translate: { count: examCase.questions.length } }}
            </button>
          </article>
        }

        <button
          app-button
          variant="outline-primary"
          type="button"
          class="align-self-start mt-auto"
          icon="chevron-left"
          (click)="back.emit()">
          {{ 'actions.back' | translate }}
        </button>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .exam-case-chooser__title {
      font-size: 1.25rem;
      font-weight: 800;
    }

    .exam-case-chooser__case {
      padding: 1rem;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius-lg);
    }

    .exam-case-chooser__text {
      max-height: 16rem;
      overflow-y: auto;
      white-space: pre-line;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamCaseChooser {
  readonly cases = input.required<ExamCase[]>();
  readonly chosen = output<string>();
  readonly back = output<void>();
}
