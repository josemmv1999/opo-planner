import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { Icon } from '../../common/components/icon/icon';
import { Modal } from '../../common/components/modal/modal';
import { BottomNav } from '../../common/components/bottom-nav/bottom-nav';
import { PageHeader } from '../../common/components/page-header/page-header';
import { Sidebar } from '../../common/components/sidebar/sidebar';
import { greetingKeyFor } from '../../common/utils/greeting-key';
import { InterfaceModeService } from '../../common/services/interface-mode.service';
import { readStorage, writeStorage } from '../../common/utils/storage';
import { AppLayoutStore } from './app-layout.store';

const SIDEBAR_COLLAPSED_KEY = 'isSidebarCollapsed';

const readIsSidebarCollapsed = (): boolean => readStorage(SIDEBAR_COLLAPSED_KEY) === 'true';

const saveIsSidebarCollapsed = (isCollapsed: boolean): void =>
  writeStorage(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));

const deepestChild = (route: ActivatedRoute): ActivatedRoute =>
  route.firstChild ? deepestChild(route.firstChild) : route;

import { SessionService } from '../../common/services/session.service';
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, Modal, Icon, TranslatePipe, Sidebar, BottomNav, PageHeader],
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
        (changeOpposition)="store.openOppositionModal()"
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
          [isTouchLayout]="isTouchLayout()"
          (oppositionClicked)="store.openOppositionModal()" />
        <router-outlet />
      </div>
    </main>
    @if (isTouchLayout()) {
      <app-bottom-nav class="d-block" [user]="store.currentUser()" />
    }

    <app-modal
      [isOpen]="store.isOppositionModalOpen()"
      [label]="'appLayout.changeOpposition' | translate"
      (closed)="store.closeOppositionModal()">
      <ng-template>
        <div class="d-flex flex-column gap-3">
          <h2 class="h5 mb-0">{{ 'appLayout.changeOpposition' | translate }}</h2>
          <div class="d-flex flex-column gap-2" role="radiogroup">
            @for (opposition of store.userOppositions(); track opposition.id) {
              @let isActive = opposition.id === store.activeOpposition()?.id;
              <button
                type="button"
                role="radio"
                class="app-layout__opposition d-flex align-items-center gap-2 text-start"
                [attr.aria-checked]="isActive"
                [disabled]="store.isChangingOpposition()"
                (click)="
                  isActive ? store.closeOppositionModal() : store.changeOpposition(opposition.id)
                ">
                <span class="app-opposition-badge">{{ opposition.abbreviation }}</span>
                <span class="fw-bold flex-grow-1">{{ opposition.name }}</span>
                @if (isActive) {
                  <app-icon class="text-primary" name="check" />
                }
              </button>
            }
          </div>
          <a
            class="btn btn-outline-primary d-flex align-items-center align-self-start"
            routerLink="/profile"
            (click)="store.closeOppositionModal()">
            <app-icon class="me-2" name="add" />
            {{ 'appLayout.addOpposition' | translate }}
          </a>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    .app-layout__opposition {
      padding: 0.75rem 0.875rem;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);

      &[aria-checked='true'] {
        border-color: var(--bs-primary);
        box-shadow: 3px 3px 0 var(--bs-primary);
      }
    }

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
  protected readonly isTouchLayout = inject(InterfaceModeService).isTouchLayout;
  readonly #router = inject(Router);
  readonly #session = inject(SessionService);
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
    this.#session.end();
    this.#router.navigate(['/login']);
  }
}
