import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../../common/components/modal/modal';
import { ExamBar } from './exam-bar/exam-bar';
import { ExamNavigator } from './exam-navigator/exam-navigator';
import { ExamQuestionCard } from './exam-question/exam-question';
import { ExamSessionStore } from './exam-session.store';

@Component({
  selector: 'app-exam-session',
  imports: [TranslatePipe, Modal, ExamBar, ExamQuestionCard, ExamNavigator],
  providers: [ExamSessionStore],
  host: { class: 'exam-session d-flex flex-column gap-3 mx-auto' },
  template: `
    @if (store.exam(); as exam) {
      <app-exam-bar
        [name]="exam.name"
        [answered]="store.answeredCount()"
        [total]="store.total()"
        [secondsLeft]="store.secondsLeft()"
        [isTimeLow]="store.isTimeLow()"
        (submitted)="store.openSubmitModal()"
        (exited)="store.openExitModal()" />

      <div class="exam-session__body">
        @if (store.currentQuestion(); as question) {
          <app-exam-question
            [question]="question"
            [index]="store.index()"
            [total]="store.total()"
            [answer]="store.currentAnswer()"
            [isFlagged]="store.isCurrentFlagged()"
            (answered)="store.answer($event)"
            (flagToggled)="store.toggleFlag()"
            (moved)="store.goTo($event)" />
        }
        <app-exam-navigator
          [answers]="store.answers()"
          [flagged]="store.flaggedSet()"
          [index]="store.index()"
          (jumped)="store.goTo($event)" />
      </div>
    } @else if (store.error()) {
      <div class="alert alert-danger mb-0" role="alert">
        {{ 'examSession.loadError' | translate }}
      </div>
    } @else {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'examSession.loading' | translate }}</span>
        </span>
      </div>
    }

    <app-modal
      [isOpen]="store.isSubmitModalOpen()"
      [label]="'examSession.submitTitle' | translate"
      (closed)="store.closeSubmitModal()">
      <ng-template>
        <div class="d-flex flex-column gap-3">
          <h2 class="h5 mb-0">{{ 'examSession.submitTitle' | translate }}</h2>
          <p class="text-body-secondary mb-0">
            {{
              'examSession.submitText'
                | translate: { blank: store.blankCount(), flagged: store.flaggedIndexes().length }
            }}
          </p>
          <div class="d-flex flex-wrap justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-outline-primary"
              (click)="store.closeSubmitModal()">
              {{ 'examSession.keepGoing' | translate }}
            </button>
            <button type="button" class="btn btn-primary" (click)="store.submit()">
              {{ 'examSession.submit' | translate }}
            </button>
          </div>
        </div>
      </ng-template>
    </app-modal>

    <app-modal
      [isOpen]="store.isExitModalOpen()"
      [label]="'examSession.exitTitle' | translate"
      (closed)="store.closeExitModal()">
      <ng-template>
        <div class="d-flex flex-column gap-3">
          <h2 class="h5 mb-0">{{ 'examSession.exitTitle' | translate }}</h2>
          <p class="text-body-secondary mb-0">{{ 'examSession.exitText' | translate }}</p>
          <div class="d-flex flex-wrap justify-content-end gap-2">
            <button type="button" class="btn btn-outline-primary" (click)="store.closeExitModal()">
              {{ 'examSession.keepGoing' | translate }}
            </button>
            <button type="button" class="btn btn-primary" (click)="exit()">
              {{ 'examSession.exit' | translate }}
            </button>
          </div>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    :host {
      max-width: 75rem;
      min-height: 100vh;
      padding: 1rem;
      container-type: inline-size;
    }

    .exam-session__body {
      display: grid;
      gap: 1rem;
      align-items: start;

      @container (min-width: 52rem) {
        grid-template-columns: minmax(0, 1fr) 18rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamSession {
  readonly examId = input.required<string>();

  protected readonly store = inject(ExamSessionStore);
  readonly #router = inject(Router);

  constructor() {
    this.store.load(this.examId);
    this.store.runTimer();
    effect(() => {
      if (this.store.hasSubmitted()) this.#router.navigate(['/exams']);
    });
  }

  protected exit(): void {
    this.store.closeExitModal();
    this.#router.navigate(['/exams']);
  }
}
