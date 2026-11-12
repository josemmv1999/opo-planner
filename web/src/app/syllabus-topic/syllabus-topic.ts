import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { TopicQuiz } from '../topic-quiz/topic-quiz';
import { NoteTile } from './note-tile/note-tile';
import { SyllabusTopicStore } from './syllabus-topic.store';
import { TopicProgress } from './topic-progress/topic-progress';

const BOE_URL = 'https://www.boe.es/buscar/act.php?id=';
const ACCEPTED_FILES = 'application/pdf,image/png,image/jpeg';

@Component({
  selector: 'app-syllabus-topic',
  imports: [RouterLink, TranslatePipe, Icon, TopicQuiz, NoteTile, TopicProgress],
  providers: [SyllabusTopicStore],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    <a
      class="syllabus-topic__back d-inline-flex align-items-center align-self-start"
      routerLink="/syllabus">
      <app-icon class="me-1" name="chevron-left" />
      {{ 'syllabusTopic.back' | translate }}
    </a>

    @if (store.isLoading() && !store.topic()) {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'syllabusTopic.loading' | translate }}</span>
        </span>
      </div>
    } @else if (store.topic(); as topic) {
      <section class="card card--cyan">
        <div class="card-body d-flex flex-column gap-3">
          <div class="syllabus-topic__hero d-flex flex-wrap align-items-center">
            <span class="syllabus-topic__number">{{ topic.number }}</span>
            <div class="syllabus-topic__heading d-flex flex-column flex-grow-1">
              <span class="syllabus-topic__meta text-body-secondary">
                {{ topic.blockLabel }} · {{ topic.blockName }}
              </span>
              <h2 class="syllabus-topic__title mb-0">{{ topic.name }}</h2>
            </div>
            @if (topic.correctPercentage !== null) {
              <span class="d-flex align-items-center gap-2">
                <span
                  class="syllabus-topic__ring d-flex align-items-center justify-content-center"
                  [style.--percentage]="topic.correctPercentage">
                  <span class="d-flex align-items-center justify-content-center">
                    {{ topic.correctPercentage }} %
                  </span>
                </span>
                <span class="syllabus-topic__meta text-body-secondary">
                  {{ 'syllabusTopic.scoreLabel' | translate }}
                </span>
              </span>
            }
            <button
              type="button"
              class="btn btn-primary d-flex align-items-center"
              (click)="quiz.open(topic.id)">
              <app-icon class="me-2" name="tests" />
              {{ 'syllabusTopic.practice' | translate }}
            </button>
          </div>
          <div class="syllabus-topic__laws d-flex flex-wrap align-items-center">
            <span class="syllabus-topic__meta text-body-secondary">
              {{ 'syllabusTopic.laws' | translate }}
            </span>
            @for (law of topic.laws; track law.boeId + law.scope) {
              <a
                class="syllabus-topic__law d-inline-flex align-items-center"
                [href]="boeUrl + law.boeId"
                target="_blank"
                rel="noopener"
                [attr.aria-label]="'syllabusTopic.readLawLabel' | translate: { name: law.name }">
                {{ law.name }}
                <span class="text-body-secondary">{{ law.scope }}</span>
                <app-icon class="text-primary" name="external" />
              </a>
            } @empty {
              <span class="syllabus-topic__meta">{{ 'syllabusTopic.noLaws' | translate }}</span>
            }
          </div>
        </div>
      </section>

      <div class="syllabus-topic__grid">
        <section class="d-flex flex-column gap-3">
          <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
            <h2 class="syllabus-topic__section mb-0">{{ 'syllabusTopic.notes' | translate }}</h2>
            <span class="syllabus-topic__meta text-body-secondary">
              {{ 'syllabusTopic.dropHint' | translate }}
            </span>
          </div>
          @if (store.error() === 'uploading') {
            <p class="text-danger small fw-bold mb-0" role="alert">
              {{ 'syllabusTopic.uploadError' | translate }}
            </p>
          }
          <div
            class="syllabus-topic__notes"
            [class.syllabus-topic__notes--over]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragging.set(false)"
            (drop)="onDrop($event, topic.id)">
            @for (note of topic.notes; track note.id) {
              <app-note-tile [note]="note" [topicId]="topic.id" />
            }
            <label
              class="syllabus-topic__add d-flex flex-column align-items-center justify-content-center text-center"
              [class.is-loading]="store.isUploading()">
              <span
                class="syllabus-topic__add-icon d-flex align-items-center justify-content-center">
                <app-icon name="upload" />
              </span>
              <strong>{{ 'syllabusTopic.addNotes' | translate }}</strong>
              <span class="syllabus-topic__meta text-body-secondary">
                {{ 'syllabusTopic.addNotesHint' | translate }}
              </span>
              <input
                #fileInput
                type="file"
                class="visually-hidden"
                multiple
                [accept]="acceptedFiles"
                [disabled]="store.isUploading()"
                (change)="uploadFiles(fileInput)" />
            </label>
          </div>
          <a
            class="syllabus-topic__write align-self-center"
            [routerLink]="['/syllabus', topic.id, 'notes', 'new']">
            {{ 'syllabusTopic.writeNote' | translate }}
          </a>
        </section>

        <app-topic-progress
          [trend]="store.trend()"
          [improvement]="store.improvement()"
          [reviewQuestions]="store.reviewQuestions()"
          [reviewCount]="store.reviewCount()"
          (practised)="quiz.practise(topic.id, store.reviewQuiz())" />
      </div>

      <nav class="syllabus-topic__pager" [attr.aria-label]="'syllabusTopic.pager' | translate">
        @if (topic.previousTopic; as previous) {
          <a
            class="syllabus-topic__neighbour d-flex align-items-center"
            [routerLink]="['/syllabus', previous.id]">
            <app-icon name="chevron-left" />
            <span class="d-flex flex-column">
              <span class="syllabus-topic__meta text-body-secondary">
                {{ 'syllabusTopic.previousTopic' | translate }}
              </span>
              <strong>{{ 'syllabus.topicName' | translate: previous }}</strong>
            </span>
          </a>
        }
        @if (topic.nextTopic; as next) {
          <a
            class="syllabus-topic__neighbour syllabus-topic__neighbour--next d-flex align-items-center justify-content-end text-end"
            [routerLink]="['/syllabus', next.id]">
            <span class="d-flex flex-column">
              <span class="syllabus-topic__meta text-body-secondary">
                {{ 'syllabusTopic.nextTopic' | translate }}
              </span>
              <strong>{{ 'syllabus.topicName' | translate: next }}</strong>
            </span>
            <app-icon name="chevron-right" />
          </a>
        }
      </nav>
    } @else if (store.error() === 'loading') {
      <div class="alert alert-danger mb-0" role="alert">
        {{ 'syllabusTopic.loadError' | translate }}
      </div>
    }

    <app-topic-quiz #quiz (closed)="reload()" />
  `,
  styles: `
    :host {
      container-type: inline-size;
    }

    .syllabus-topic__back {
      min-height: 1.5rem;
      font-size: 0.875rem;
      font-weight: 800;
      text-decoration: none;
    }

    .syllabus-topic__hero {
      gap: 1rem 1.5rem;
    }

    .syllabus-topic__number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1.5rem;
      font-weight: 900;
      background-color: var(--bs-info);
      border: 2px solid var(--bs-dark);
      border-radius: 1rem;
    }

    .syllabus-topic__heading {
      min-width: 14rem;
    }

    .syllabus-topic__title {
      font-size: 1.5rem;
      font-weight: 900;
      line-height: 1.2;
    }

    .syllabus-topic__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .syllabus-topic__ring {
      width: 3.25rem;
      height: 3.25rem;
      background: conic-gradient(
        var(--bs-primary) calc(var(--percentage) * 1%),
        rgba(var(--bs-dark-rgb), 0.14) 0
      );
      border-radius: 50%;

      span {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.75rem;
        font-weight: 900;
        background-color: var(--bs-white);
        border-radius: 50%;
      }
    }

    .syllabus-topic__laws {
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.14);
    }

    .syllabus-topic__law {
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 800;
      color: var(--bs-body-color);
      text-decoration: none;
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);

      &:hover {
        box-shadow: 2px 2px 0 var(--bs-primary);
      }
    }

    .syllabus-topic__grid {
      display: grid;
      gap: 1.5rem;
      align-items: start;

      @container (min-width: 64rem) {
        grid-template-columns: minmax(0, 1fr) 22rem;
      }

      @container (min-width: 96rem) {
        grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      }
    }

    .syllabus-topic__section {
      font-size: 1.375rem;
      font-weight: 900;
    }

    .syllabus-topic__notes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
      gap: 1.25rem;
      padding: 0.25rem;
      border-radius: 1.25rem;
    }

    .syllabus-topic__notes--over {
      background-color: rgba(var(--bs-primary-rgb), 0.08);
      outline: 2px dashed var(--bs-primary);
    }

    .syllabus-topic__add {
      gap: 0.5rem;
      min-height: 14.5rem;
      padding: 1.25rem;
      color: var(--bs-primary);
      cursor: pointer;
      background-color: rgba(var(--bs-primary-rgb), 0.08);
      border: 2px dashed var(--bs-primary);
      border-radius: 1rem;

      &:hover {
        background-color: rgba(var(--bs-primary-rgb), 0.16);
      }

      &:focus-within {
        outline: 0.1875rem solid var(--bs-primary);
        outline-offset: 0.125rem;
      }

      strong {
        color: var(--bs-body-color);
      }
    }

    .syllabus-topic__add-icon {
      width: 3.25rem;
      height: 3.25rem;
      color: var(--bs-white);
      background-color: var(--bs-primary);
      border-radius: 50%;
    }

    .syllabus-topic__write {
      font-size: 0.875rem;
      font-weight: 800;
    }

    .syllabus-topic__pager {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;

      @container (max-width: 40rem) {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .syllabus-topic__neighbour {
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      color: var(--bs-body-color);
      text-decoration: none;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 1rem;

      &:hover {
        box-shadow: 0.25rem 0.25rem 0 var(--bs-primary);
      }
    }

    .syllabus-topic__neighbour--next {
      grid-column: -2;

      @container (max-width: 40rem) {
        grid-column: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyllabusTopic {
  readonly topicId = input.required<string>();
  readonly #topicId = computed(() => Number(this.topicId()));

  protected readonly store = inject(SyllabusTopicStore);
  protected readonly boeUrl = BOE_URL;
  protected readonly acceptedFiles = ACCEPTED_FILES;
  protected readonly isDragging = signal(false);

  constructor() {
    this.store.load(this.#topicId);
  }

  protected reload(): void {
    this.store.load(this.#topicId());
  }

  protected uploadFiles(fileInput: HTMLInputElement): void {
    this.store.uploadFiles([...(fileInput.files ?? [])]);
    fileInput.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDrop(event: DragEvent, topicId: number): void {
    event.preventDefault();
    this.isDragging.set(false);
    const accepted = ACCEPTED_FILES.split(',');
    const files = [...(event.dataTransfer?.files ?? [])].filter(({ type }) =>
      accepted.includes(type),
    );
    if (files.length && topicId) this.store.uploadFiles(files);
  }
}
