import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NAV_ITEMS } from '../../constants/nav-items';
import { User } from '../../models/user.model';
import { InitialsPipe } from '../../pipes/initials.pipe';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Icon, InitialsPipe],
  host: { class: 'bg-white border border-2 border-dark' },
  template: `
    <nav
      class="bottom-nav__items d-flex align-items-center h-100"
      [attr.aria-label]="'appLayout.navLabel' | translate">
      @for (item of navItems; track item.path) {
        <a
          class="bottom-nav__link d-flex flex-column align-items-center justify-content-center"
          [routerLink]="item.path"
          routerLinkActive="bottom-nav__link--active"
          ariaCurrentWhenActive="page">
          <app-icon [name]="item.icon" />
          <span class="bottom-nav__label text-truncate">{{ item.labelKey | translate }}</span>
        </a>
      }
      <a
        class="bottom-nav__link d-flex flex-column align-items-center justify-content-center"
        routerLink="/profile"
        routerLinkActive="bottom-nav__link--active"
        ariaCurrentWhenActive="page">
        <span class="app-avatar" aria-hidden="true">
          @if (user(); as user) {
            {{ user | initials }}
          }
        </span>
        <span class="bottom-nav__label text-truncate">{{ 'appLayout.profile' | translate }}</span>
      </a>
    </nav>
  `,
  styles: `
    :host {
      position: fixed;
      right: 1rem;
      bottom: calc(1.25rem + env(safe-area-inset-bottom));
      left: 1rem;
      z-index: 1030;
      max-width: 30rem;
      height: 4.75rem;
      padding: 0 0.5rem;
      margin: 0 auto;
      border-radius: 1.375rem;
      box-shadow: 0.25rem 0.25rem 0 var(--bs-dark);
    }

    .bottom-nav__items {
      gap: 0.25rem;
    }

    .bottom-nav__link {
      flex: 1 1 0;
      min-width: 0;
      height: 4rem;
      gap: 0.25rem;
      color: var(--bs-body-color);
      border-radius: 0.875rem;

      app-icon {
        width: 1.5rem;
        height: 1.5rem;
      }

      .app-avatar {
        width: 1.75rem;
        height: 1.75rem;
        font-size: 0.75rem;
      }
    }

    .bottom-nav__label {
      max-width: 100%;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .bottom-nav__link--active {
      color: var(--bs-white);
      background-color: var(--bs-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  readonly user = input<User | null>(null);

  protected readonly navItems = NAV_ITEMS;
}
