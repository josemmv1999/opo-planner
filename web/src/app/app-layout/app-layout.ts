import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BottomNav } from '../../common/components/bottom-nav/bottom-nav';
import { Icon } from '../../common/components/icon/icon';
import { MobileHeader } from '../../common/components/mobile-header/mobile-header';
import { Modal } from '../../common/components/modal/modal';
import { Sidebar } from '../../common/components/sidebar/sidebar';
import { InitialsPipe } from '../../common/pipes/initials.pipe';
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

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, TranslatePipe, Sidebar, BottomNav, MobileHeader, Modal, Icon, InitialsPipe],
  providers: [AppLayoutStore],
  host: { class: 'd-flex flex-column flex-lg-row min-vh-100' },
  template: `
    <app-mobile-header class="d-flex d-lg-none" />
    <app-sidebar
      class="d-none d-lg-flex"
      [isCollapsed]="isSidebarCollapsed()"
      [user]="store.currentUser()"
      [opposition]="store.activeOpposition()"
      (toggleCollapse)="toggleSidebar()"
      (logout)="logout()" />
    <main class="flex-grow-1 p-3 p-lg-4">
      <router-outlet />
    </main>
    <app-bottom-nav
      class="d-block d-lg-none"
      [user]="store.currentUser()"
      (openAccount)="store.openAccountModal()" />

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
          <button type="button" class="btn btn-primary d-flex align-items-center" (click)="logout()">
            <app-icon class="me-2" name="logout" />
            {{ 'appLayout.logout' | translate }}
          </button>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    main {
      min-width: 0;
      container-type: inline-size;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {
  protected readonly store = inject(AppLayoutStore);
  protected readonly isSidebarCollapsed = signal(readIsSidebarCollapsed());
  readonly #router = inject(Router);

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
