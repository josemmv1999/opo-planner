import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { Modal } from '../../common/components/modal/modal';
import { QuizQuestionCard } from './quiz-question/quiz-question';
import { QuizResult } from './quiz-result/quiz-result';
import { QuizSetup } from './quiz-setup/quiz-setup';
import { TopicQuizStore } from './topic-quiz.store';

@Component({
  selector: 'app-topic-quiz',
  imports: [RouterLink, TranslatePipe, Icon, Modal, QuizSetup, QuizQuestionCard, QuizResult],
  providers: [TopicQuizStore],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    @if (store.topic(); as topic) {
      @if (store.phase() !== 'playing') {
        <a
          class="topic-quiz__back d-inline-flex align-items-center align-self-start"
          [routerLink]="['/syllabus', topic.id]">
          <app-icon class="me-1" name="chevron-left" />
          {{ 'topicQuiz.backToTopic' | translate }}
        </a>
      }
      <div class="d-flex flex-column gap-1">
        <p class="topic-quiz__eyebrow text-body-secondary mb-0">
          {{ 'topicQuiz.eyebrow' | translate }}
        </p>
        <h2 class="topic-quiz__title mb-0">
          {{ 'syllabus.topicName' | translate: { number: topic.number, name: topic.name } }}
        </h2>
      </div>

      @switch (store.phase()) {
        @case ('setup') {
          <app-quiz-setup
            [count]="store.count()"
            [isLoading]="store.isLoadingQuestions()"
            (countChanged)="store.setCount($event)"
            (started)="store.start()" />
        }
        @case ('playing') {
          @if (store.currentQuestion(); as question) {
            <app-quiz-question
              [question]="question"
              [index]="store.index()"
              [total]="store.questions().length"
              [answer]="store.currentAnswer()"
              [correctCount]="store.correctCount()"
              [wrongCount]="store.wrongCount()"
              [isLast]="store.isLastQuestion()"
              (answered)="store.answer($event)"
              (nextClicked)="store.next()"
              (exited)="store.openExitModal()" />
          }
        }
        @case ('finished') {
          <app-quiz-result
            [topicId]="topic.id"
            [correctCount]="store.correctCount()"
            [total]="store.questions().length"
            [percentage]="store.percentage()"
            [verdictKey]="store.verdictKey()"
            [wrongQuestions]="store.wrongQuestions()"
            (restarted)="store.restart()" />
        }
      }
    } @else if (store.error()) {
      <div class="alert alert-danger mb-0" role="alert">
        {{ 'topicQuiz.loadError' | translate }}
      </div>
    } @else {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'topicQuiz.loading' | translate }}</span>
        </span>
      </div>
    }

    <app-modal
      [isOpen]="store.isExitModalOpen()"
      [label]="'topicQuiz.exitTitle' | translate"
      (closed)="store.closeExitModal()">
      <ng-template>
        <div class="d-flex flex-column gap-3">
          <h3 class="h5 mb-0">{{ 'topicQuiz.exitTitle' | translate }}</h3>
          <p class="text-body-secondary mb-0">{{ 'topicQuiz.exitText' | translate }}</p>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-primary" (click)="store.closeExitModal()">
              {{ 'topicQuiz.keepGoing' | translate }}
            </button>
            <button type="button" class="btn btn-primary" (click)="exit()">
              {{ 'topicQuiz.exit' | translate }}
            </button>
          </div>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    .topic-quiz__back {
      min-height: 1.5rem;
      font-size: 0.875rem;
      font-weight: 800;
    }

    .topic-quiz__eyebrow {
      font-weight: 700;
    }

    .topic-quiz__title {
      font-size: 1.5rem;
      font-weight: 900;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicQuiz {
  readonly topicId = input.required<string>();

  protected readonly store = inject(TopicQuizStore);
  readonly #router = inject(Router);

  constructor() {
    this.store.loadTopic(computed(() => Number(this.topicId())));
  }

  protected exit(): void {
    this.store.closeExitModal();
    this.#router.navigate(['/syllabus', this.topicId()]);
  }
}
