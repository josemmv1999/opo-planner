import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { InitialsPipe } from '../../common/pipes/initials.pipe';
import { AppLayoutStore } from '../app-layout/app-layout.store';
import { ProfileForm } from './profile-form/profile-form';

@Component({
  selector: 'app-profile',
  imports: [TranslatePipe, Icon, InitialsPipe, ProfileForm],
  template: `
    @if (store.currentUser(); as user) {
      <section class="card card--cyan profile__main">
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

      <div class="d-flex flex-column gap-3">
        @if (store.activeOpposition(); as opposition) {
          <section class="card card--yellow">
            <div class="card-body d-flex flex-column gap-3">
              <h3 class="profile__section mb-0">{{ 'profile.opposition' | translate }}</h3>
              <div class="d-flex align-items-center gap-2">
                <span class="app-opposition-badge">{{ opposition.abbreviation }}</span>
                <span class="fw-bold">{{ opposition.name }}</span>
              </div>
            </div>
          </section>
        }

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
  readonly #router = inject(Router);

  protected logout(): void {
    this.#router.navigate(['/login']);
  }
}
