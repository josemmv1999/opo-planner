import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import {
  GeneratedImportErrorReason,
  GeneratedImportResult,
} from '../../../common/models/exam-import.model';

const REASONS: GeneratedImportErrorReason[] = ['duplicate', 'topic', 'format'];

@Component({
  selector: 'app-generated-import-form',
  imports: [Button, TranslatePipe],
  template: `
    <form class="d-flex flex-column gap-3" (submit)="$event.preventDefault(); submit()">
      <label class="d-flex flex-column gap-1 fw-bold">
        {{ 'admin.generated.files' | translate }}
        <input
          class="form-control"
          type="file"
          accept=".json,application/json"
          multiple
          (change)="pick($event)" />
      </label>
      <button
        app-button
        type="submit"
        class="align-self-start"
        icon="upload"
        [isLoading]="isImporting()"
        [disabled]="isImporting() || !files().length">
        {{ 'admin.generated.import' | translate }}
      </button>
      @if (hasError()) {
        <p class="alert alert-danger mb-0" role="alert">
          {{ 'admin.generated.error' | translate }}
        </p>
      }
      @if (result(); as result) {
        <div class="alert alert-success mb-0" role="status">
          <strong>{{ 'admin.generated.imported' | translate: { count: result.imported } }}</strong>
          @for (skipped of skippedCounts(); track skipped.reason) {
            <span class="d-block">
              {{
                'admin.generated.skipped.' + skipped.reason | translate: { count: skipped.count }
              }}
            </span>
          }
        </div>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratedImportForm {
  readonly isImporting = input(false);
  readonly hasError = input(false);
  readonly result = input<GeneratedImportResult | null>(null);
  readonly submitted = output<File[]>();

  protected readonly files = signal<File[]>([]);
  protected readonly skippedCounts = computed(() =>
    REASONS.map((reason) => ({
      reason,
      count: this.result()?.errors.filter((error) => error.reason === reason).length ?? 0,
    })).filter(({ count }) => count > 0),
  );

  protected pick(event: Event): void {
    this.files.set([...((event.target as HTMLInputElement).files ?? [])]);
  }

  protected submit(): void {
    if (this.files().length) this.submitted.emit(this.files());
  }
}
