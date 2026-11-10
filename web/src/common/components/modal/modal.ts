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
      [class.modal--lg]="size() === 'lg'"
      [attr.aria-label]="label()"
      (cancel)="onCancel($event)"
      (close)="onClose()"
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

    .modal--lg {
      max-width: 48rem;

      @media (max-width: 36rem) {
        width: 100%;
        max-width: none;
        height: 100dvh;
        max-height: none;
        margin: 0;

        .card {
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
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
  readonly size = input<'md' | 'lg'>('md');
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

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  protected onClose(): void {
    if (!this.isOpen()) return;
    this.closed.emit();
    if (this.isOpen()) this.dialog().nativeElement.showModal();
  }

  protected onMouseDown(event: MouseEvent): void {
    this.isPressedOnBackdrop = event.target === this.dialog().nativeElement;
  }

  protected onMouseUp(event: MouseEvent): void {
    if (this.isPressedOnBackdrop && event.target === this.dialog().nativeElement)
      this.closed.emit();
  }
}
