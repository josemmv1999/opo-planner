import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout/auth-layout';
import { Login } from './login/login';
import { Register } from './register/register';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
