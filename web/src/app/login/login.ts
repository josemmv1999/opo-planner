import { resource, signal, computed, effect } from '@angular/core';

// Signal para las credenciales que dispara el resource
credentialsSignal = signal<Credentials | null>(null);

// Resource que se ejecuta automáticamente cuando cambian las credenciales
loginResource = resource({
  request: () => this.credentialsSignal(),
  loader: ({ request: credentials }) => {
    if (!credentials) {
      return Promise.reject('No credentials provided');
    }

    return this.#accountService.getToken(credentials).pipe(
      tap((token) => {
        // Side effects del login exitoso
        this.#localStorage.token = token;
        this.#events.login();
        this.#router.navigateByUrl('/dashboard');
      })
    ).toPromise();
  }
});

// Status derivado automáticamente del resource
statusSignal = computed(() => {
  const resource = this.loginResource;

  if (resource.isLoading()) return ResourceStatus.Loading;
  if (resource.error()) return ResourceStatus.Error;
  if (resource.value()) return ResourceStatus.Resolved;
  return ResourceStatus.Idle;
});

// Effect para manejar errores reactivamente
private errorEffect = effect(() => {
  const error = this.loginResource.error();
  if (error) {
    this.#toast.addError(
      this.#translateService.instant('login.wrongUserOrPass'),
      this.#translateService.instant('login.invalidCredentials'),
    );
  }
});

// Método público simplificado
onLogin(credentials: Credentials): void {
  this.credentialsSignal.set(credentials);
}

// Método para limpiar el estado
clearLogin(): void {
  this.credentialsSignal.set(null);
}

// Opción alternativa: Resource con configuración más avanzada
loginResourceAdvanced = resource({
  request: () => this.credentialsSignal(),
  loader: async ({ request: credentials }) => {
    if (!credentials) return null;

    try {
      const token = await this.#accountService.getToken(credentials).toPromise();

      // Side effects en el loader
      this.#localStorage.token = token;
      this.#events.login();

      // Navegación asíncrona
      await this.#router.navigateByUrl('/dashboard');

      return { token, success: true };
    } catch (error) {
      // El resource manejará este error automáticamente
      throw new Error('Invalid credentials');
    }
  }
});

// Computed signals derivados
isLoading = computed(() => this.loginResource.isLoading());
hasError = computed(() => !!this.loginResource.error());
isLoggedIn = computed(() => !!this.loginResource.value());

// Effect para side effects específicos
private loginSuccessEffect = effect(() => {
  const value = this.loginResource.value();
  if (value) {
    // Aquí puedes añadir lógica adicional post-login
    console.log('Login successful');
  }
});

// Uso en template (ejemplo)
/*
@if (loginResource.isLoading()) {
  <div>Logging in...</div>
}

@if (loginResource.error()) {
  <div class="error">Login failed</div>
}

@if (loginResource.value()) {
  <div>Login successful!</div>
}
*/

// Opción con resource y retry automático
loginResourceWithRetry = resource({
  request: () => this.credentialsSignal(),
  loader: ({ request: credentials, abortSignal }) => {
    if (!credentials) return null;

    return this.#accountService.getToken(credentials).pipe(
      retry({ count: 2, delay: 1000 }), // Retry automático
      tap((token) => {
        this.#localStorage.token = token;
        this.#events.login();
        this.#router.navigateByUrl('/dashboard');
      }),
      // Manejar abort signal para cancelación
      takeUntil(
        new Promise(resolve => abortSignal?.addEventListener('abort', resolve))
      )
    ).toPromise();
  }
});
