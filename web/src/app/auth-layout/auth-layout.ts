import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, TranslatePipe],
  host: { class: 'auth-page' },
  template: `
    <main
      class="container d-flex flex-column justify-content-center align-items-center gap-4 min-vh-100 py-5">
      <img class="auth-page__logo" src="/brand/logo.svg" [alt]="'authLayout.logoAlt' | translate" />
      <div class="card auth-page__card w-100">
        <div class="card-body">
          <router-outlet />
        </div>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
