import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { BottomNav } from '../../common/components/bottom-nav/bottom-nav';
import { Icon } from '../../common/components/icon/icon';
import { Modal } from '../../common/components/modal/modal';
import { PageHeader } from '../../common/components/page-header/page-header';
import { Sidebar } from '../../common/components/sidebar/sidebar';
import { InitialsPipe } from '../../common/pipes/initials.pipe';
import { greetingKeyFor } from '../../common/utils/greeting-key';
import { injectIsTouchLayout } from '../../common/utils/touch-layout';
import { AppLayoutStore } from './app-layout.store';

const SIDEBAR_COLLAPSED_KEY = 'isSidebarCollapsed';

const readIsSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

const saveIsSidebarCollapsed = (isCollapsed: boolean): void => {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  } catch {
    return;
  }
};

const deepestChild = (route: ActivatedRoute): ActivatedRoute =>
  route.firstChild ? deepestChild(route.firstChild) : route;

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, TranslatePipe, Sidebar, BottomNav, PageHeader, Modal, Icon, InitialsPipe],
  providers: [AppLayoutStore],
  host: {
    class: 'd-flex min-vh-100',
    '[class.flex-column]': 'isTouchLayout()',
    '[class.app-layout--touch]': 'isTouchLayout()',
  },
  template: `
    @if (!isTouchLayout()) {
      <app-sidebar
        class="d-flex"
        [isCollapsed]="isSidebarCollapsed()"
        [user]="store.currentUser()"
        [opposition]="store.activeOpposition()"
        (toggleCollapse)="toggleSidebar()"
        (logout)="logout()" />
    }
    <main class="app-layout__main flex-grow-1">
      <div class="app-layout__content d-flex flex-column mx-auto">
        @let greeting = greetingParams();
        <app-page-header
          [isHome]="!pageTitleKey()"
          [greeting]="greeting ? (greeting.key | translate: { name: greeting.name }) : ''"
          [title]="pageTitleKey() ? (pageTitleKey() | translate) : ''"
          [opposition]="store.activeOpposition()"
          [isTouchLayout]="isTouchLayout()" />
        <router-outlet />
      </div>
    </main>
    @if (isTouchLayout()) {
      <app-bottom-nav
        class="d-block"
        [user]="store.currentUser()"
        (openAccount)="store.openAccountModal()" />
    }

    <app-modal
      [isOpen]="store.isAccountModalOpen()"
      [label]="'appLayout.account' | translate"
      (closed)="store.closeAccountModal()">
      <ng-template>
        @if (store.currentUser(); as user) {
          <div class="d-flex align-items-center gap-3 mb-4">
            <span class="app-avatar">{{ user | initials }}</span>
            <div class="overflow-hidden">
              <p class="fw-bold mb-0 text-truncate">{{ user.name }} {{ user.surname }}</p>
              <p class="text-body-secondary mb-0 text-truncate">{{ user.email }}</p>
            </div>
          </div>
        }
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-primary" (click)="store.closeAccountModal()">
            {{ 'actions.cancel' | translate }}
          </button>
          <button
            type="button"
            class="btn btn-primary d-flex align-items-center"
            (click)="logout()">
            <app-icon class="me-2" name="logout" />
            {{ 'appLayout.logout' | translate }}
          </button>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    .app-layout__main {
      min-width: 0;
      padding: 1.5rem 1rem 0;
    }

    :host {
      --app-layout-padding-y: 1.25rem;
    }

    .app-layout__content {
      gap: 1.5rem;
      max-width: 120rem;
      container-type: inline-size;
    }

    :host(:not(.app-layout--touch)) {
      .app-layout__main {
        padding: var(--app-layout-padding-y) 2rem;
      }

      .app-layout__content {
        min-height: calc(100dvh - 2 * var(--app-layout-padding-y));
      }
    }

    @media (max-height: 56rem) {
      :host(:not(.app-layout--touch)) {
        --app-layout-padding-y: 0.75rem;

        .app-layout__content {
          gap: 1rem;
        }
      }
    }

    :host(.app-layout--touch) .app-layout__main {
      padding-bottom: calc(7rem + env(safe-area-inset-bottom));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {
  protected readonly store = inject(AppLayoutStore);
  protected readonly isSidebarCollapsed = signal(readIsSidebarCollapsed());
  protected readonly isTouchLayout = injectIsTouchLayout();
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  protected readonly pageTitleKey = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestChild(this.#route).snapshot.data['titleKey'] as string | undefined),
    ),
  );
  protected readonly greetingParams = computed(() => {
    const user = this.store.currentUser();
    return user ? { key: greetingKeyFor(new Date()), name: user.name } : null;
  });

  constructor() {
    this.store.loadLayoutData();
    effect(() => saveIsSidebarCollapsed(this.isSidebarCollapsed()));
  }

  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update((isCollapsed) => !isCollapsed);
  }

  protected logout(): void {
    this.#router.navigate(['/login']);
  }
}
