import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-confirm-content',
  imports: [TranslatePipe, Button],
  template: `
    <h2 class="card-title fs-4">{{ title() }}</h2>
    <p>{{ message() }}</p>
    <div class="d-flex justify-content-end gap-2">
      <app-button variant="outline-primary" (click)="cancelAction.emit()">
        {{ 'actions.cancel' | translate }}
      </app-button>
      <app-button [variant]="isDanger() ? 'danger' : 'primary'" (click)="confirm.emit()">
        {{ 'actions.confirm' | translate }}
      </app-button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmContent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly isDanger = input(false);

  readonly confirm = output();
  readonly cancelAction = output();
}
