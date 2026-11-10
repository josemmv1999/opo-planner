import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { Modal } from '../../common/components/modal/modal';
import { InitialsPipe } from '../../common/pipes/initials.pipe';
import { AppLayoutStore } from '../app-layout/app-layout.store';
import { InterfaceChoice } from '../onboarding/interface-choice/interface-choice';
import { OppositionChoices } from '../onboarding/opposition-choices/opposition-choices';
import { PasswordForm } from './password-form/password-form';
import { ProfileForm } from './profile-form/profile-form';
import { ProfileStore } from './profile.store';

@Component({
  selector: 'app-profile',
  imports: [
    TranslatePipe,
    Icon,
    Modal,
    InitialsPipe,
    ProfileForm,
    PasswordForm,
    InterfaceChoice,
    OppositionChoices,
  ],
  providers: [ProfileStore],
  template: `
    @if (store.currentUser(); as user) {
      <div class="d-flex flex-column gap-3">
        <section class="card card--cyan">
          <div class="card-body d-flex flex-column gap-4">
            <div class="d-flex align-items-center gap-3">
              <span class="app-avatar profile__avatar">{{ user | initials }}</span>
              <div class="overflow-hidden">
                <h2 class="profile__name mb-0 text-truncate">{{ user.name }} {{ user.surname }}</h2>
                <p class="text-body-secondary mb-0 text-truncate">{{ user.email }}</p>
              </div>
            </div>
            <div class="d-flex flex-column gap-3">
              <h3 class="profile__section mb-0">{{ 'profile.data' | translate }}</h3>
              <app-profile-form
                [profile]="{ name: user.name, surname: user.surname, email: user.email }"
                [isSaving]="store.isSavingUser()"
                [hasError]="store.error() === 'saving'"
                (submitted)="store.updateUser($event)" />
            </div>
          </div>
        </section>
        <section class="card card--flat">
          <div class="card-body d-flex flex-column gap-3">
            <h3 class="profile__section mb-0">{{ 'profile.menu' | translate }}</h3>
            <div class="form-check form-switch mb-0">
              <input
                id="profile-menu-auto"
                class="form-check-input"
                type="checkbox"
                role="switch"
                [checked]="profile.interfaceMode() === null"
                (change)="toggleAutomaticMenu()" />
              <label class="form-check-label fw-bold" for="profile-menu-auto">
                {{ 'profile.menuAuto' | translate }}
              </label>
            </div>
            @if (profile.interfaceMode(); as mode) {
              <app-interface-choice [mode]="mode" (changed)="profile.setInterfaceMode($event)" />
            } @else {
              <p class="text-body-secondary small mb-0">
                {{ 'profile.menuDetected.' + profile.detectedInterfaceMode() | translate }}
              </p>
            }
            <p class="text-body-secondary small mb-0">{{ 'profile.menuHint' | translate }}</p>
          </div>
        </section>
      </div>

      <div class="d-flex flex-column gap-3">
        <section class="card card--yellow">
          <div class="card-body d-flex flex-column gap-3">
            <h3 class="profile__section mb-0">{{ 'profile.oppositions' | translate }}</h3>
            @if (profile.isLoadingOppositions()) {
              <span class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">{{ 'profile.loading' | translate }}</span>
              </span>
            } @else if (profile.error() === 'loading') {
              <p class="text-danger small fw-bold mb-0" role="alert">
                {{ 'profile.oppositionsLoadError' | translate }}
              </p>
            } @else {
              <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
                @for (opposition of profile.oppositions(); track opposition.id) {
                  <li class="d-flex align-items-center gap-2">
                    <span class="app-opposition-badge">{{ opposition.level }}</span>
                    <span class="fw-bold flex-grow-1">{{ opposition.name }}</span>
                    @if (opposition.id === store.activeOpposition()?.id) {
                      <span class="badge rounded-pill text-bg-primary">
                        {{ 'profile.active' | translate }}
                      </span>
                    }
                  </li>
                }
              </ul>
              @if (profile.availableOppositions().length) {
                <button
                  type="button"
                  class="btn btn-outline-primary d-flex align-items-center align-self-start"
                  (click)="profile.openAddModal()">
                  <app-icon class="me-2" name="add" />
                  {{ 'profile.addOpposition' | translate }}
                </button>
              } @else {
                <p class="text-body-secondary small mb-0">
                  {{ 'profile.allOppositions' | translate }}
                </p>
              }
            }
          </div>
        </section>

        <section class="card card--teal">
          <div class="card-body d-flex flex-column gap-3">
            <h3 class="profile__section mb-0">{{ 'profile.password' | translate }}</h3>
            @for (key of [profile.passwordFormKey()]; track key) {
              <app-password-form
                [isSaving]="profile.isChangingPassword()"
                [hasError]="profile.error() === 'password'"
                (submitted)="profile.changePassword($event)" />
            }
          </div>
        </section>

        <section class="card card--flat">
          <div class="card-body d-flex flex-column gap-3">
            <h3 class="profile__section mb-0">{{ 'profile.session' | translate }}</h3>
            <p class="text-body-secondary mb-0">{{ 'profile.sessionText' | translate }}</p>
            <button
              type="button"
              class="btn btn-outline-primary d-flex align-items-center align-self-start"
              (click)="logout()">
              <app-icon class="me-2" name="logout" />
              {{ 'appLayout.logout' | translate }}
            </button>
          </div>
        </section>
      </div>
    } @else if (store.error() === 'loading') {
      <div class="alert alert-danger mb-0" role="alert">{{ 'profile.loadError' | translate }}</div>
    } @else {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'profile.loading' | translate }}</span>
        </span>
      </div>
    }

    <app-modal
      size="lg"
      [isOpen]="profile.isAddModalOpen()"
      [label]="'profile.addTitle' | translate"
      (closed)="profile.closeAddModal()">
      <ng-template>
        <div class="d-flex flex-column gap-3">
          <div>
            <h2 class="h5 mb-1">{{ 'profile.addTitle' | translate }}</h2>
            <p class="text-body-secondary mb-0">{{ 'profile.addLead' | translate }}</p>
          </div>
          <app-opposition-choices
            [oppositions]="profile.availableOppositions()"
            [selectedIds]="profile.selectedIds()"
            (toggled)="profile.toggleSelection($event)" />
          @if (profile.error() === 'adding') {
            <p class="text-danger small fw-bold mb-0" role="alert">
              {{ 'profile.addError' | translate }}
            </p>
          }
          <div class="d-flex flex-wrap justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-outline-primary"
              [disabled]="profile.isAddingOppositions()"
              (click)="profile.closeAddModal()">
              {{ 'actions.cancel' | translate }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              [class.is-loading]="profile.isAddingOppositions()"
              [disabled]="!profile.selectedIds().length || profile.isAddingOppositions()"
              (click)="profile.addSelected()">
              {{ 'profile.add' | translate }}
            </button>
          </div>
        </div>
      </ng-template>
    </app-modal>
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.5rem;
      align-items: start;
    }

    @container (min-width: 56rem) {
      :host {
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      }
    }

    .profile__avatar {
      width: 4rem;
      height: 4rem;
      font-size: 1.375rem;
    }

    .profile__name {
      font-size: 1.375rem;
      font-weight: 900;
    }

    .profile__section {
      font-size: 1.125rem;
      font-weight: 900;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  protected readonly store = inject(AppLayoutStore);
  protected readonly profile = inject(ProfileStore);
  readonly #router = inject(Router);

  constructor() {
    this.profile.loadOppositions();
  }

  protected toggleAutomaticMenu(): void {
    this.profile.setInterfaceMode(
      this.profile.interfaceMode() === null ? this.profile.detectedInterfaceMode() : null,
    );
  }

  protected logout(): void {
    this.#router.navigate(['/login']);
  }
}
