import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SyllabusFilter } from '../../common/models/syllabus.model';
import { SyllabusBlockCard } from './syllabus-block-card/syllabus-block-card';
import { SyllabusStore } from './syllabus.store';

@Component({
  selector: 'app-syllabus',
  imports: [TranslatePipe, SyllabusBlockCard],
  providers: [SyllabusStore],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    @if (store.isLoading()) {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'syllabus.loading' | translate }}</span>
        </span>
      </div>
    } @else if (store.error() === 'loading') {
      <div class="alert alert-danger mb-0" role="alert">{{ 'syllabus.loadError' | translate }}</div>
    } @else {
      <div class="syllabus__stats">
        <div class="card card--green syllabus__stat">
          <strong>{{
            'syllabus.studiedOf'
              | translate: { studied: store.studiedCount(), total: store.blocks().length }
          }}</strong>
          <span>{{ 'syllabus.studiedBlocks' | translate }}</span>
        </div>
        <div class="card card--yellow syllabus__stat">
          <strong>{{
            store.averagePercentage() === null ? '—' : store.averagePercentage() + ' %'
          }}</strong>
          <span>{{ 'syllabus.averageCorrect' | translate }}</span>
        </div>
        <div class="card card--cyan syllabus__stat">
          <strong>{{
            'syllabus.studiedOf'
              | translate: { studied: store.practisedTopicCount(), total: store.topicCount() }
          }}</strong>
          <span>{{ 'syllabus.practisedTopics' | translate }}</span>
        </div>
        <div class="card card--teal syllabus__stat">
          <strong>{{ store.notesCount() }}</strong>
          <span>{{ 'syllabus.notes' | translate }}</span>
        </div>
      </div>

      <div
        class="d-flex flex-wrap gap-2"
        role="group"
        [attr.aria-label]="'syllabus.filterLabel' | translate">
        @for (filter of filters; track filter) {
          <button
            type="button"
            class="syllabus__chip"
            [attr.aria-pressed]="store.filter() === filter"
            (click)="store.setFilter(filter)">
            {{ 'syllabus.filters.' + filter | translate }}
          </button>
        }
      </div>

      @if (store.error() === 'saving') {
        <div class="alert alert-danger mb-0" role="alert">
          {{ 'syllabus.saveError' | translate }}
        </div>
      }

      <div class="d-flex flex-column gap-3">
        @for (block of store.visibleBlocks(); track block.id) {
          <app-syllabus-block-card
            [block]="block"
            [isExpanded]="store.expandedBlockIds().includes(block.id)"
            [isUpdating]="store.updatingBlockIds().includes(block.id)"
            (toggled)="store.toggleExpanded(block.id)"
            (studiedToggled)="store.toggleStudied(block.id)" />
        } @empty {
          <p class="text-body-secondary mb-0">{{ 'syllabus.empty' | translate }}</p>
        }
      </div>

      <p class="syllabus__hint text-body-secondary mb-0">
        {{ 'syllabus.studiedHint' | translate }}
      </p>
    }
  `,
  styles: `
    .syllabus__stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;

      @container (min-width: 48rem) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .syllabus__stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 1.25rem;

      strong {
        font-size: 1.75rem;
        font-weight: 900;
        line-height: 1;
      }

      span {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--bs-secondary-color);
      }
    }

    .syllabus__chip {
      padding: 0.375rem 0.875rem;
      font-size: 0.875rem;
      font-weight: 800;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);

      &[aria-pressed='true'] {
        color: var(--bs-white);
        background-color: var(--bs-dark);
      }
    }

    .syllabus__hint {
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Syllabus {
  protected readonly store = inject(SyllabusStore);
  protected readonly filters: SyllabusFilter[] = ['all', 'pending', 'studied'];

  constructor() {
    this.store.load();
  }
}
