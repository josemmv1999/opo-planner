import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NAV_ITEMS } from '../../constants/nav-items';
import { Opposition } from '../../models/opposition.model';
import { User } from '../../models/user.model';
import { InitialsPipe } from '../../pipes/initials.pipe';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, InitialsPipe, Icon],
  host: {
    class: 'flex-column sticky-lg-top vh-100 bg-white border-end border-2 border-dark',
    '[class.sidebar--collapsed]': 'isCollapsed()',
  },
  template: `
    <div class="sidebar__head d-flex align-items-center">
      <span class="sidebar__brand sidebar__fade d-flex">
        <img class="sidebar__logo" src="/brand/logo.svg" [alt]="'appLayout.logoAlt' | translate" />
      </span>
      @let toggleLabel = (isCollapsed() ? 'appLayout.expand' : 'appLayout.collapse') | translate;
      <button
        type="button"
        class="sidebar__toggle btn d-flex align-items-center justify-content-center p-0"
        [title]="toggleLabel"
        [attr.aria-label]="toggleLabel"
        [attr.aria-expanded]="!isCollapsed()"
        (click)="toggleCollapse.emit()">
        <app-icon name="sidebar" />
      </button>
    </div>

    @if (opposition(); as opposition) {
      <button
        type="button"
        class="sidebar__selector btn btn-light d-flex align-items-center gap-2 text-start"
        [title]="'appLayout.changeOpposition' | translate">
        <span class="app-opposition-badge">{{ opposition.abbreviation }}</span>
        <span class="sidebar__opposition-name sidebar__fade">{{ opposition.name }}</span>
        <app-icon class="sidebar__fade" name="chevron-down" />
      </button>
    }

    <nav class="d-flex flex-column gap-1" [attr.aria-label]="'appLayout.navLabel' | translate">
      @for (item of navItems; track item.path) {
        <a
          class="sidebar__link app-nav-link d-flex align-items-center gap-3"
          [routerLink]="item.path"
          routerLinkActive="app-nav-link--active"
          ariaCurrentWhenActive="page"
          [attr.title]="isCollapsed() ? (item.labelKey | translate) : null">
          <app-icon [name]="item.icon" />
          <span class="sidebar__fade">{{ item.labelKey | translate }}</span>
        </a>
      }
    </nav>

    <div class="d-flex flex-column gap-2 mt-auto">
      @if (user(); as user) {
        <div
          class="sidebar__user d-flex align-items-center gap-2"
          [title]="user.name + ' ' + user.surname">
          <span class="app-avatar">{{ user | initials }}</span>
          <span class="sidebar__user-name sidebar__fade text-truncate"
            >{{ user.name }} {{ user.surname }}</span
          >
        </div>
      }
      <button
        type="button"
        class="sidebar__logout btn btn-outline-primary d-flex align-items-center"
        [attr.title]="isCollapsed() ? ('appLayout.logout' | translate) : null"
        (click)="logout.emit()">
        <app-icon class="me-2" name="logout" />
        <span class="sidebar__fade">{{ 'appLayout.logout' | translate }}</span>
      </button>
    </div>
  `,
  styles: `
    :host {
      flex: 0 0 auto;
      gap: 1.25rem;
      width: 16.5rem;
      padding: 1.25rem 0.875rem;
      overflow: hidden;
      transition: width 0.25s cubic-bezier(0.2, 0, 0, 1);
    }

    :host(.sidebar--collapsed) {
      width: 5.25rem;
    }

    .sidebar__fade {
      white-space: nowrap;
      transition: opacity 0.15s ease 0.1s;
    }

    :host(.sidebar--collapsed) .sidebar__fade {
      opacity: 0;
      transition-duration: 0.1s;
      transition-delay: 0s;
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .sidebar__fade,
      .sidebar__toggle {
        transition: none;
      }
    }

    .sidebar__brand {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
    }

    .sidebar__logo {
      flex-shrink: 0;
      height: 2.25rem;
    }

    .sidebar__toggle {
      flex-shrink: 0;
      width: 2.75rem;
      height: 2.75rem;
      color: var(--bs-body-color);
      border: 0;
      border-radius: var(--bs-border-radius);
      transition: margin-right 0.25s cubic-bezier(0.2, 0, 0, 1);

      &:hover {
        background-color: rgba(var(--bs-primary-rgb), 0.08);
      }

      app-icon {
        width: 1.375rem;
        height: 1.375rem;
      }
    }

    :host(.sidebar--collapsed) .sidebar__toggle {
      margin-right: 0.25rem;
    }

    .sidebar__selector {
      flex-shrink: 0;
      padding: 0.5rem 0.625rem;
      overflow: hidden;
      border: 2px solid var(--bs-dark);
      border-radius: 0.875rem;
    }

    .sidebar__opposition-name {
      flex: 1 0 8.5rem;
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1.25;
      white-space: normal;
    }

    .sidebar__link {
      height: 2.75rem;
      padding-left: 1.0625rem;
      overflow: hidden;

      app-icon {
        width: 1.375rem;
        height: 1.375rem;
      }
    }

    .sidebar__user {
      padding-left: 0.625rem;
    }

    .sidebar__user-name {
      min-width: 0;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .sidebar__logout {
      height: 2.75rem;
      padding-left: 1rem;
      overflow: hidden;
      font-weight: 800;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly isCollapsed = input.required<boolean>();
  readonly user = input.required<User | null>();
  readonly opposition = input.required<Opposition | null>();
  readonly toggleCollapse = output();
  readonly logout = output();

  protected readonly navItems = NAV_ITEMS;
}
