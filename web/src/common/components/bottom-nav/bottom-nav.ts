import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NAV_ITEMS } from '../../constants/nav-items';
import { User } from '../../models/user.model';
import { InitialsPipe } from '../../pipes/initials.pipe';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, InitialsPipe, Icon],
  host: { class: 'sticky-bottom bg-white border-top border-2 border-dark' },
  template: `
    <nav class="d-flex align-items-stretch h-100" [attr.aria-label]="'appLayout.navLabel' | translate">
      @for (item of navItems; track item.path) {
        <a
          class="bottom-nav__link d-flex align-items-center justify-content-center"
          [routerLink]="item.path"
          routerLinkActive="bottom-nav__link--active"
          ariaCurrentWhenActive="page"
          [title]="item.labelKey | translate"
          [attr.aria-label]="item.labelKey | translate">
          <span class="bottom-nav__pill d-flex rounded-pill">
            <app-icon [name]="item.icon" />
          </span>
        </a>
      }
      @if (user(); as user) {
        <div class="bottom-nav__profile d-flex align-items-center">
          <button
            type="button"
            class="btn d-flex p-1 rounded-circle"
            [title]="'appLayout.account' | translate"
            [attr.aria-label]="'appLayout.account' | translate"
            (click)="openAccount.emit()">
            <span class="app-avatar app-avatar--sm">{{ user | initials }}</span>
          </button>
        </div>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      height: 4.5rem;
    }

    .bottom-nav__link {
      flex: 1 1 0;
      min-width: 0;
      color: var(--bs-body-color);
    }

    .bottom-nav__pill {
      padding: 0.375rem 0.5rem;

      app-icon {
        width: 1.625rem;
        height: 1.625rem;
      }
    }

    .bottom-nav__link--active {
      color: var(--bs-primary);

      .bottom-nav__pill {
        background-color: rgba(var(--bs-primary-rgb), 0.14);
      }
    }

    .bottom-nav__profile {
      flex-shrink: 0;
      padding: 0 0.25rem;
      margin: 0.75rem 0;
      border-left: 2px dashed var(--bs-border-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  readonly user = input.required<User | null>();
  readonly openAccount = output();

  protected readonly navItems = NAV_ITEMS;
}
