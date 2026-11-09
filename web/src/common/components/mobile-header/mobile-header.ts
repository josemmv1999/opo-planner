import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-mobile-header',
  imports: [TranslatePipe],
  host: { class: 'align-items-center bg-white border-bottom px-3 py-2' },
  template: `<img class="mobile-header__logo" src="/brand/logo.svg" [alt]="'appLayout.logoAlt' | translate" />`,
  styles: `
    .mobile-header__logo {
      height: 2.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHeader {}
