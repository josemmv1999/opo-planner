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
    class: 'flex-column gap-4 sticky-lg-top vh-100 bg-white border-end p-3',
    '[class.sidebar--collapsed]': 'isCollapsed()',
    '(transitionend)': 'showFullContentAfterExpanding($event)',
  },
  template: `
    <div
      class="d-flex align-items-center gap-2"
      [class.flex-column]="!isShowingFullContent()"
      [class.justify-content-between]="isShowingFullContent()">
      <img
        class="sidebar__logo"
        [src]="isShowingFullContent() ? '/brand/logo.svg' : '/brand/logo-mark.svg'"
        [alt]="'appLayout.logoAlt' | translate" />
      <button
        type="button"
        class="btn btn-link text-body d-flex align-items-center p-1"
        [title]="(isCollapsed() ? 'appLayout.expand' : 'appLayout.collapse') | translate"
        [attr.aria-expanded]="!isCollapsed()"
        (click)="toggleCollapse.emit()">
        <app-icon [name]="isCollapsed() ? 'chevron-right' : 'chevron-left'" />
      </button>
    </div>

    @if (isShowingFullContent() && opposition(); as opposition) {
      <button type="button" class="btn btn-light d-flex align-items-center gap-2 text-start p-2">
        <span class="app-opposition-badge">{{ opposition.abbreviation }}</span>
        <span class="sidebar__opposition-name">{{ opposition.name }}</span>
      </button>
    }

    <nav class="d-flex flex-column gap-1 flex-grow-1" [attr.aria-label]="'appLayout.navLabel' | translate">
      @for (item of navItems; track item.path) {
        <a
          class="app-nav-link d-flex align-items-center text-nowrap overflow-hidden px-3 py-2"
          [class.justify-content-center]="!isShowingFullContent()"
          [routerLink]="item.path"
          routerLinkActive="app-nav-link--active"
          ariaCurrentWhenActive="page"
          [attr.title]="isShowingFullContent() ? null : (item.labelKey | translate)">
          <app-icon [class.me-2]="isShowingFullContent()" [name]="item.icon" />
          @if (isShowingFullContent()) {
            {{ item.labelKey | translate }}
          }
        </a>
      }
    </nav>

    <div class="d-flex flex-column gap-2" [class.align-items-center]="!isShowingFullContent()">
      @if (user(); as user) {
        <div class="d-flex align-items-center gap-2 overflow-hidden">
          <span
            class="app-avatar"
            [attr.title]="isShowingFullContent() ? null : user.name + ' ' + user.surname">
            {{ user | initials }}
          </span>
          @if (isShowingFullContent()) {
            <span class="text-truncate">{{ user.name }} {{ user.surname }}</span>
          }
        </div>
      }
      <button
        type="button"
        class="btn btn-outline-primary d-flex align-items-center justify-content-center text-nowrap"
        [attr.title]="isShowingFullContent() ? null : ('appLayout.logout' | translate)"
        (click)="logout.emit()">
        <app-icon [class.me-2]="isShowingFullContent()" name="logout" />
        @if (isShowingFullContent()) {
          {{ 'appLayout.logout' | translate }}
        }
      </button>
    </div>
  `,
  styles: `
    :host {
      flex: 0 0 auto;
      width: 16.5rem;
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
      height: 2.5rem;
    }

    .sidebar__opposition-name {
      min-width: 0;
      font-weight: 700;
      line-height: 1.2;
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
