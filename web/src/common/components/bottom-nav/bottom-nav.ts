import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NAV_ITEMS } from '../../constants/nav-items';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Icon],
  host: { class: 'bg-white border border-2 border-dark' },
  template: `
    <nav class="d-flex align-items-center justify-content-between h-100" [attr.aria-label]="'appLayout.navLabel' | translate">
      @for (item of navItems; track item.path) {
        <a
          class="bottom-nav__link d-flex align-items-center justify-content-center"
          [routerLink]="item.path"
          routerLinkActive="bottom-nav__link--active"
          ariaCurrentWhenActive="page"
          [title]="item.labelKey | translate"
          [attr.aria-label]="item.labelKey | translate">
          <app-icon [name]="item.icon" />
        </a>
      }
    </nav>
  `,
  styles: `
    :host {
      position: fixed;
      right: 1rem;
      bottom: calc(1.25rem + env(safe-area-inset-bottom));
      left: 1rem;
      z-index: 1030;
      height: 4rem;
      padding: 0 0.5rem;
      border-radius: 1.375rem;
      box-shadow: 0.25rem 0.25rem 0 var(--bs-dark);
    }

    .bottom-nav__link {
      width: 3rem;
      height: 2.75rem;
      color: var(--bs-body-color);
      border-radius: 0.875rem;

      app-icon {
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    .bottom-nav__link--active {
      color: var(--bs-white);
      background-color: var(--bs-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  protected readonly navItems = NAV_ITEMS;
}
