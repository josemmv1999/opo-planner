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
    <dialog
      #dialog
      [attr.aria-label]="label()"
      (close)="isOpen() && closed.emit()"
      (mousedown)="onMouseDown($event)"
      (mouseup)="onMouseUp($event)">
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
  readonly label = input.required<string>();
  readonly closed = output();

  protected readonly content = contentChild.required(TemplateRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private isPressedOnBackdrop = false;

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.isOpen()) dialog.showModal();
      else dialog.close();
    });
  }

  protected onMouseDown({ target }: MouseEvent): void {
    this.isPressedOnBackdrop = target === this.dialog().nativeElement;
  }

  protected onMouseUp({ target }: MouseEvent): void {
    const dialog = this.dialog().nativeElement;
    if (this.isPressedOnBackdrop && target === dialog) dialog.close();
  }
}
