import { Routes } from '@angular/router';
import { EmptyState } from '../common/components/empty-state/empty-state';
import { AppLayout } from './app-layout/app-layout';
import { AuthLayoutComponent } from './auth-layout/auth-layout';
import { Home } from './home/home';
import { Login } from './login/login';
import { Onboarding } from './onboarding/onboarding';
import { Register } from './register/register';
import { Syllabus } from './syllabus/syllabus';

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
  { path: 'onboarding', component: Onboarding },
  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'home', component: Home },
      { path: 'syllabus', component: Syllabus, data: { titleKey: 'nav.syllabus' } },
      { path: 'exams', component: EmptyState, data: { titleKey: 'nav.exams', icon: 'timer' } },
      { path: 'planner', component: EmptyState, data: { titleKey: 'nav.planner', icon: 'planner' } },
    ],
  },
];
