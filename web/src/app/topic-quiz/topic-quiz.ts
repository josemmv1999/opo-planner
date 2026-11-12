import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { filter, map, pairwise } from 'rxjs';
import { Button } from '../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../../common/components/modal/modal';
import { QuizQuestionCard } from './quiz-question/quiz-question';
import { QuizResult } from './quiz-result/quiz-result';
import { QuizSetup } from './quiz-setup/quiz-setup';
import { QuizQuestion } from '../../common/models/quiz.model';
import { TopicQuizStore } from './topic-quiz.store';

@Component({
  selector: 'app-topic-quiz',
  imports: [
    Button,
    NgTemplateOutlet,
    TranslatePipe,
    Modal,
    QuizSetup,
    QuizQuestionCard,
    QuizResult,
  ],
  providers: [TopicQuizStore],
  template: `
    <ng-template #heading>
      @if (store.topic(); as topic) {
        <div class="d-flex flex-column gap-1">
          <p class="topic-quiz__eyebrow text-body-secondary mb-0">
            {{ 'topicQuiz.eyebrow' | translate }}
          </p>
          <h2 class="topic-quiz__title mb-0">
            {{ 'syllabus.topicName' | translate: { number: topic.number, name: topic.name } }}
          </h2>
        </div>
      }
    </ng-template>

    <app-modal
      [isOpen]="store.isSetupModalOpen()"
      [label]="'topicQuiz.eyebrow' | translate"
      (closed)="store.closeSetupModal()">
      <ng-template>
        <div class="d-flex flex-column gap-4">
          @if (store.isLoadingTopic()) {
            <div class="d-flex justify-content-center py-4">
              <span class="spinner-border text-primary" role="status">
                <span class="visually-hidden">{{ 'topicQuiz.loading' | translate }}</span>
              </span>
            </div>
          } @else if (store.error()) {
            <div class="alert alert-danger mb-0" role="alert">
              {{ 'topicQuiz.loadError' | translate }}
            </div>
          } @else {
            <ng-container [ngTemplateOutlet]="heading" />
            <app-quiz-setup
              [count]="store.count()"
              [isLoading]="store.isLoadingQuestions()"
              (countChanged)="store.setCount($event)"
              (started)="store.start()"
              (cancelled)="store.closeSetupModal()" />
          }
        </div>
      </ng-template>
    </app-modal>

    <app-modal
      size="lg"
      [isOpen]="store.isQuizModalOpen()"
      [label]="'topicQuiz.eyebrow' | translate"
      (closed)="store.requestClose()">
      <ng-template>
        <div class="d-flex flex-column gap-4">
          <ng-container [ngTemplateOutlet]="heading" />
          @if (store.phase() === 'finished') {
            <app-quiz-result
              [correctCount]="store.correctCount()"
              [total]="store.questions().length"
              [percentage]="store.percentage()"
              [verdictKey]="store.verdictKey()"
              [wrongQuestions]="store.wrongQuestions()"
              (restarted)="store.restart()"
              (closed)="store.requestClose()" />
          } @else if (store.currentQuestion(); as question) {
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
              (exited)="store.requestClose()" />
          }
        </div>
      </ng-template>
    </app-modal>

    <app-modal
      [isOpen]="store.isExitModalOpen()"
      [label]="'topicQuiz.exitTitle' | translate"
      (closed)="store.closeExitModal()">
      <ng-template>
        <div class="d-flex flex-column gap-3">
          <h3 class="h5 mb-0">{{ 'topicQuiz.exitTitle' | translate }}</h3>
          <p class="text-body-secondary mb-0">{{ 'topicQuiz.exitText' | translate }}</p>
          <div class="d-flex justify-content-end gap-2">
            <button
              app-button
              variant="outline-primary"
              type="button"
              (click)="store.closeExitModal()">
              {{ 'topicQuiz.keepGoing' | translate }}
            </button>
            <button app-button type="button" (click)="store.exit()">
              {{ 'topicQuiz.exit' | translate }}
            </button>
          </div>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .topic-quiz__eyebrow {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .topic-quiz__title {
      font-size: 1.25rem;
      font-weight: 900;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicQuiz {
  protected readonly store = inject(TopicQuizStore);
  readonly closed = outputFromObservable(
    toObservable(this.store.isQuizModalOpen).pipe(
      pairwise(),
      filter(([wasOpen, isOpen]) => wasOpen && !isOpen),
      map(() => undefined),
    ),
  );

  open(topicId: number): void {
    this.store.open(topicId);
  }

  practise(topicId: number, questions: QuizQuestion[]): void {
    this.store.practise({ topicId, questions });
  }
}
