import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { Icon } from '../../../common/components/icon/icon';
import { TopicMaterial } from '../../../common/models/syllabus.model';

@Component({
  selector: 'app-topic-materials',
  imports: [Button, Icon, TranslatePipe],
  host: { class: 'd-flex flex-column gap-3' },
  template: `
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
      <h2 class="topic-materials__title mb-0">{{ 'syllabusTopic.materials.title' | translate }}</h2>
      @if (isAdmin()) {
        <label
          class="btn btn-outline-primary d-flex align-items-center"
          [class.is-loading]="isUploading()">
          <app-icon class="me-2" name="upload" />
          {{ 'syllabusTopic.materials.upload' | translate }}
          <input
            #fileInput
            type="file"
            class="visually-hidden"
            multiple
            accept="application/pdf"
            [disabled]="isUploading()"
            (change)="upload(fileInput)" />
        </label>
      }
    </div>
    @if (hasUploadError()) {
      <p class="text-danger small fw-bold mb-0" role="alert">
        {{ 'syllabusTopic.materials.uploadError' | translate }}
      </p>
    }
    <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
      @for (material of materials(); track material.id) {
        <li class="topic-materials__item d-flex align-items-center gap-2">
          <app-icon class="text-primary" name="notes" />
          <span class="flex-grow-1">{{ material.title }}</span>
          @if (isAdmin()) {
            <button
              app-button
              type="button"
              variant="outline-danger"
              size="sm"
              icon="delete"
              [isIconOnly]="true"
              [title]="'syllabusTopic.materials.delete' | translate: { title: material.title }"
              (click)="deleted.emit(material.id)"></button>
          }
        </li>
      } @empty {
        <li class="text-body-secondary">{{ 'syllabusTopic.materials.empty' | translate }}</li>
      }
    </ul>
  `,
  styles: `
    .topic-materials__title {
      font-size: 1.375rem;
      font-weight: 900;
    }

    .topic-materials__item {
      padding: 0.75rem 1rem;
      font-weight: 800;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicMaterials {
  readonly materials = input.required<TopicMaterial[]>();
  readonly isAdmin = input.required<boolean>();
  readonly isUploading = input(false);
  readonly hasUploadError = input(false);
  readonly uploaded = output<File[]>();
  readonly deleted = output<number>();

  protected upload(fileInput: HTMLInputElement): void {
    this.uploaded.emit([...(fileInput.files ?? [])]);
    fileInput.value = '';
  }
}
