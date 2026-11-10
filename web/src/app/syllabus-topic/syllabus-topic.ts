import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { TopicQuiz } from '../topic-quiz/topic-quiz';
import { SyllabusTopicStore } from './syllabus-topic.store';

const BOE_URL = 'https://www.boe.es/buscar/act.php?id=';

@Component({
  selector: 'app-syllabus-topic',
  imports: [RouterLink, TranslatePipe, Icon, FormatDatePipe, TopicQuiz],
  providers: [SyllabusTopicStore],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    <a
      class="syllabus-topic__back d-inline-flex align-items-center align-self-start"
      routerLink="/syllabus">
      <app-icon class="me-1" name="chevron-left" />
      {{ 'syllabusTopic.back' | translate }}
    </a>

    @if (store.isLoading()) {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'syllabusTopic.loading' | translate }}</span>
        </span>
      </div>
    } @else if (store.topic(); as topic) {
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div class="d-flex flex-column gap-1">
          <p class="syllabus-topic__eyebrow text-body-secondary mb-0">
            {{ topic.blockLabel }} · {{ topic.blockName }}
          </p>
          <h2 class="syllabus-topic__title mb-0">
            {{ 'syllabus.topicName' | translate: { number: topic.number, name: topic.name } }}
          </h2>
        </div>
        <button
          type="button"
          class="btn btn-primary d-flex align-items-center"
          (click)="quiz.open(topic.id)">
          <app-icon class="me-2" name="tests" />
          {{ 'syllabusTopic.practice' | translate }}
        </button>
      </div>

      <section class="card card--teal">
        <div class="card-body d-flex flex-column gap-3">
          <h3 class="syllabus-topic__section mb-0">{{ 'syllabusTopic.laws' | translate }}</h3>
          <ul class="list-unstyled mb-0">
            @for (law of topic.laws; track law.boeId + law.scope) {
              <li class="syllabus-topic__row d-flex align-items-center gap-3">
                <span class="d-flex flex-column flex-grow-1 overflow-hidden">
                  <span class="fw-bold">{{ law.name }}</span>
                  <span class="syllabus-topic__meta text-body-secondary">{{ law.scope }}</span>
                </span>
                <a
                  class="btn btn-outline-primary btn-sm d-flex align-items-center"
                  [href]="boeUrl + law.boeId"
                  target="_blank"
                  rel="noopener"
                  [attr.aria-label]="'syllabusTopic.readLawLabel' | translate: { name: law.name }">
                  {{ 'syllabusTopic.readLaw' | translate }}
                  <app-icon class="ms-2" name="external" />
                </a>
              </li>
            } @empty {
              <li class="text-body-secondary">{{ 'syllabusTopic.noLaws' | translate }}</li>
            }
          </ul>
        </div>
      </section>

      <section class="card card--yellow">
        <div class="card-body d-flex flex-column gap-3">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h3 class="syllabus-topic__section mb-0">{{ 'syllabusTopic.notes' | translate }}</h3>
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm d-flex align-items-center"
                disabled
                [title]="'syllabusTopic.notesSoon' | translate">
                <app-icon class="me-2" name="upload" />
                {{ 'syllabusTopic.uploadPdf' | translate }}
              </button>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm d-flex align-items-center"
                disabled
                [title]="'syllabusTopic.notesSoon' | translate">
                <app-icon class="me-2" name="add" />
                {{ 'syllabusTopic.newNote' | translate }}
              </button>
            </div>
          </div>
          <ul class="list-unstyled mb-0">
            @for (note of topic.notes; track note.id) {
              <li class="syllabus-topic__row d-flex align-items-center gap-3">
                <span class="d-flex flex-column flex-grow-1 overflow-hidden">
                  <span class="fw-bold">{{ note.title }}</span>
                  <span class="syllabus-topic__meta text-body-secondary">
                    {{ 'syllabusTopic.noteKind.' + note.kind | translate }} ·
                    {{ note.updatedAt | formatDate: 'd MMM' }}
                  </span>
                </span>
              </li>
            } @empty {
              <li class="text-body-secondary">{{ 'syllabusTopic.noNotes' | translate }}</li>
            }
          </ul>
        </div>
      </section>

      <p class="syllabus-topic__meta text-body-secondary mb-0">
        {{
          topic.correctPercentage === null
            ? ('syllabusTopic.notPractised' | translate)
            : ('syllabusTopic.score' | translate: { percentage: topic.correctPercentage })
        }}
      </p>
    } @else if (store.error()) {
      <div class="alert alert-danger mb-0" role="alert">
        {{ 'syllabusTopic.loadError' | translate }}
      </div>
    }

    <app-topic-quiz #quiz />
  `,
  styles: `
    :host {
      container-type: inline-size;
    }

    .syllabus-topic__back {
      min-height: 1.5rem;
      font-size: 0.875rem;
      font-weight: 800;
    }

    .syllabus-topic__eyebrow {
      font-weight: 700;
    }

    .syllabus-topic__title {
      font-size: 1.5rem;
      font-weight: 900;
    }

    .syllabus-topic__section {
      font-size: 1.125rem;
      font-weight: 900;
    }

    .syllabus-topic__row {
      padding: 0.75rem 0;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.14);

      &:first-child {
        padding-top: 0;
        border-top: 0;
      }
    }

    .syllabus-topic__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    @container (max-width: 34rem) {
      .syllabus-topic__row {
        flex-wrap: wrap;
        gap: 0.5rem !important;

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyllabusTopic {
  readonly topicId = input.required<string>();

  protected readonly store = inject(SyllabusTopicStore);
  protected readonly boeUrl = BOE_URL;

  constructor() {
    this.store.load(computed(() => Number(this.topicId())));
  }
}
