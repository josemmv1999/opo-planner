import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: '',
  host: { 'aria-hidden': 'true', '[style.mask-image]': 'maskImage()' },
  styles: `
    :host {
      display: inline-block;
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      background-color: currentColor;
      mask-position: center;
      mask-repeat: no-repeat;
      mask-size: contain;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<string>();

  protected readonly maskImage = computed(() => `url('/icons/${this.name()}.svg')`);
}
