import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../common/components/icon/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../../common/components/modal/modal';
import { ExamBar } from './exam-bar/exam-bar';
import { ExamNavigator } from './exam-navigator/exam-navigator';
import { ExamQuestionCard } from './exam-question/exam-question';
import { ExamResult } from './exam-result/exam-result';
import { ExamSessionStore } from './exam-session.store';

const OPTION_KEYS = ['a', 'b', 'c', 'd', 'e'];
const FLAG_KEY = 'm';

@Component({
  selector: 'app-exam-session',
  imports: [TranslatePipe, Icon, Modal, ExamBar, ExamQuestionCard, ExamNavigator, ExamResult],
  providers: [ExamSessionStore],
  host: {
    class: 'exam-session d-flex flex-column gap-3 mx-auto',
    '(document:keydown)': 'onKeydown($event)',
  },
  template: `
    @if (store.exam(); as exam) {
      @if (!store.hasSubmitted()) {
        <app-exam-bar
          [name]="exam.name"
          [answered]="store.answeredCount()"
          [total]="store.total()"
          [secondsLeft]="store.secondsLeft()"
          [isTimeLow]="store.isTimeLow()"
          (submitted)="store.openSubmitModal()"
          (exited)="store.openExitModal()" />
      } @else if (store.isReviewing()) {
        <div class="card card--flat exam-session__review d-flex flex-row align-items-center">
          <button
            type="button"
            class="btn btn-link exam-session__back d-flex align-items-center p-0"
            (click)="store.closeReview()">
            <app-icon class="me-1" name="chevron-left" />
            {{ 'examSession.backToResult' | translate }}
          </button>
          <strong class="text-truncate">{{ exam.name }}</strong>
        </div>
      } @else {
        <app-exam-result
          [name]="exam.name"
          [correct]="store.correctCount()"
          [total]="store.total()"
          [percentage]="store.percentage()"
          [wrong]="store.wrongCount()"
          [blank]="store.blankCount()"
          [secondsTaken]="store.secondsTaken()"
          [secondsPerQuestion]="store.secondsPerQuestion()"
          [weakBlocks]="store.weakBlocks()"
          (reviewed)="store.startReview()" />
      }

      @if (!store.hasSubmitted() || store.isReviewing()) {
        <div class="exam-session__body">
          @if (store.currentQuestion(); as question) {
            <app-exam-question
              [question]="question"
              [index]="store.index()"
              [total]="store.total()"
              [answer]="store.currentAnswer()"
              [isFlagged]="store.isCurrentFlagged()"
              [correctOption]="store.isReviewing() ? question.correctOption : null"
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
      }
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
      max-width: 90rem;
      min-height: 100vh;
      padding: 1rem;
      container-type: inline-size;
    }

    .exam-session__review {
      gap: 1rem;
      padding: 0.75rem 1rem;
    }

    .exam-session__back {
      font-size: 0.875rem;
      font-weight: 800;
      text-decoration: none;
    }

    .exam-session__body {
      display: grid;
      gap: 1rem;
      align-items: start;

      @container (min-width: 52rem) {
        flex-grow: 1;
        grid-template-columns: minmax(0, 1fr) 18rem;
        align-items: stretch;
      }

      @container (min-width: 80rem) {
        grid-template-columns: minmax(0, 1fr) 22rem;
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
  }

  protected onKeydown(event: KeyboardEvent): void {
    const isAnswering = !this.store.hasSubmitted();
    const isBlocked =
      (!isAnswering && !this.store.isReviewing()) ||
      this.store.isSubmitModalOpen() ||
      this.store.isExitModalOpen() ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target as HTMLElement).matches('input, textarea, select');
    if (isBlocked) return;
    const key = event.key.toLowerCase();
    const option = OPTION_KEYS.indexOf(key);
    const optionCount = this.store.currentQuestion()?.options.length ?? 0;
    if (key === 'arrowright') this.store.goTo(this.store.index() + 1);
    else if (key === 'arrowleft') this.store.goTo(this.store.index() - 1);
    else if (isAnswering && option >= 0 && option < optionCount) this.store.answer(option);
    else if (isAnswering && key === FLAG_KEY) this.store.toggleFlag();
    else return;
    event.preventDefault();
  }

  protected exit(): void {
    this.store.closeExitModal();
    this.#router.navigate(['/exams']);
  }
}
