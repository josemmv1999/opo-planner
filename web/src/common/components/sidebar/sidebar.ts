import { ChangeDetectionStrategy, Component, ElementRef, inject, input, linkedSignal, output } from '@angular/core';
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
    '(transitionend)': 'showFullContentAfterExpanding($event)',
  },
  template: `
    <div
      class="d-flex align-items-center gap-3"
      [class.flex-column]="!isShowingFullContent()"
      [class.justify-content-between]="isShowingFullContent()">
      <img
        class="sidebar__logo"
        [src]="isShowingFullContent() ? '/brand/logo.svg' : '/brand/logo-mark.svg'"
        [alt]="'appLayout.logoAlt' | translate" />
      <button
        type="button"
        class="sidebar__toggle btn btn-light bg-white d-flex align-items-center justify-content-center p-0"
        [title]="(isCollapsed() ? 'appLayout.expand' : 'appLayout.collapse') | translate"
        [attr.aria-label]="(isCollapsed() ? 'appLayout.expand' : 'appLayout.collapse') | translate"
        [attr.aria-expanded]="!isCollapsed()"
        (click)="toggleCollapse.emit()">
        <app-icon name="sidebar" />
      </button>
    </div>

    @if (opposition(); as opposition) {
      <button
        type="button"
        class="sidebar__selector btn btn-light d-flex align-items-center gap-2 text-start p-2"
        [class.justify-content-center]="!isShowingFullContent()"
        [title]="'appLayout.changeOpposition' | translate">
        <span class="app-opposition-badge">{{ opposition.abbreviation }}</span>
        @if (isShowingFullContent()) {
          <span class="sidebar__opposition-name flex-grow-1">{{ opposition.name }}</span>
          <app-icon name="chevron-down" />
        } @else {
          <span class="visually-hidden">{{ opposition.name }}</span>
        }
      </button>
    }

    <nav class="d-flex flex-column gap-1" [attr.aria-label]="'appLayout.navLabel' | translate">
      @for (item of navItems; track item.path) {
        <a
          class="sidebar__link app-nav-link d-flex align-items-center gap-3 text-nowrap overflow-hidden"
          [class.justify-content-center]="!isShowingFullContent()"
          [class.px-3]="isShowingFullContent()"
          [routerLink]="item.path"
          routerLinkActive="app-nav-link--active"
          ariaCurrentWhenActive="page"
          [title]="item.labelKey | translate">
          <app-icon [name]="item.icon" />
          @if (isShowingFullContent()) {
            {{ item.labelKey | translate }}
          } @else {
            <span class="visually-hidden">{{ item.labelKey | translate }}</span>
          }
        </a>
      }
    </nav>

    <div class="d-flex flex-column gap-2 mt-auto">
      @if (user(); as user) {
        <div
          class="d-flex align-items-center gap-2 overflow-hidden p-1"
          [class.justify-content-center]="!isShowingFullContent()"
          [title]="user.name + ' ' + user.surname">
          <span class="app-avatar">{{ user | initials }}</span>
          @if (isShowingFullContent()) {
            <span class="sidebar__user-name text-truncate">{{ user.name }} {{ user.surname }}</span>
          }
        </div>
      }
      <button
        type="button"
        class="sidebar__logout btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 text-nowrap"
        [title]="'appLayout.logout' | translate"
        [attr.aria-label]="'appLayout.logout' | translate"
        (click)="logout.emit()">
        <app-icon name="logout" />
        @if (isShowingFullContent()) {
          {{ 'appLayout.logout' | translate }}
        }
      </button>
    </div>
  `,
  styles: `
    :host {
      flex: 0 0 auto;
      gap: 1.25rem;
      width: 16.5rem;
      padding: 1.25rem 0.875rem;
      overflow-x: hidden;
      transition: width 0.35s ease-in-out;
    }

    :host(.sidebar--collapsed) {
      width: 5.25rem;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition-duration: 1ms;
      }
    }

    .sidebar__logo {
      height: 2.25rem;
    }

    .sidebar__toggle {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      border: 2px solid var(--bs-border-color);
    }

    .sidebar__selector {
      border: 2px solid var(--bs-dark);
      border-radius: 0.875rem;
    }

    .sidebar__opposition-name {
      min-width: 0;
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1.25;
    }

    .sidebar__link {
      height: 2.75rem;

      app-icon {
        width: 1.375rem;
        height: 1.375rem;
      }
    }

    .sidebar__user-name {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .sidebar__logout {
      height: 2.75rem;
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
  protected readonly isShowingFullContent = linkedSignal<boolean, boolean>({
    source: this.isCollapsed,
    computation: (isCollapsed, previous) => !isCollapsed && !previous,
  });
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected showFullContentAfterExpanding(event: TransitionEvent): void {
    if (event.target === this.#host.nativeElement && event.propertyName === 'width' && !this.isCollapsed()) {
      this.isShowingFullContent.set(true);
    }
  }
}
