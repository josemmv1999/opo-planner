import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  contentChild,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [NgTemplateOutlet],
  template: `
    <!-- El equivalente de teclado del clic en el fondo es Esc, nativo del dialog -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog #dialog (close)="closed.emit()" (click)="closeOnBackdropClick($event)">
      @if (isOpen()) {
        <div class="card">
          <div class="card-body overflow-y-auto">
            <ng-container [ngTemplateOutlet]="content()" />
          </div>
        </div>
      }
    </dialog>
  `,
  styles: `
    dialog {
      width: calc(100% - 2rem);
      max-width: 32rem;
      padding: 0;
      overflow: visible;
      background: transparent;
      border: 0;
    }

    dialog::backdrop {
      background-color: rgba(var(--bs-dark-rgb), 0.4);
    }

    .card {
      max-height: calc(100dvh - 2rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  readonly isOpen = input.required<boolean>();
  readonly closed = output();

  protected readonly content = contentChild.required(TemplateRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.isOpen()) dialog.showModal();
      else dialog.close();
    });
  }

  protected closeOnBackdropClick({ target }: MouseEvent): void {
    const dialog = this.dialog().nativeElement;
    if (target === dialog) dialog.close();
  }
}
