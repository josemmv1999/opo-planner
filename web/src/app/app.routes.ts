import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '../common/guards/auth.guard';
import { AppLayout } from './app-layout/app-layout';
import { AuthLayoutComponent } from './auth-layout/auth-layout';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
      {
        path: 'register',
        loadComponent: () => import('./register/register').then((m) => m.Register),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding').then((m) => m.Onboarding),
    canActivate: [authGuard],
  },
  {
    path: 'exams/:examId',
    loadComponent: () => import('./exam-session/exam-session').then((m) => m.ExamSession),
    canActivate: [authGuard],
  },
  {
    path: 'syllabus/:topicId/notes/:noteId',
    loadComponent: () => import('./note/note').then((m) => m.Note),
    canActivate: [authGuard],
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', loadComponent: () => import('./home/home').then((m) => m.Home) },
      {
        path: 'syllabus',
        loadComponent: () => import('./syllabus/syllabus').then((m) => m.Syllabus),
        data: { titleKey: 'nav.syllabus' },
      },
      {
        path: 'syllabus/:topicId',
        loadComponent: () => import('./syllabus-topic/syllabus-topic').then((m) => m.SyllabusTopic),
        data: { titleKey: 'nav.syllabus' },
      },
      {
        path: 'exams',
        loadComponent: () => import('./exams/exams').then((m) => m.Exams),
        data: { titleKey: 'nav.exams' },
      },
      {
        path: 'planner',
        loadComponent: () => import('./planner/planner').then((m) => m.Planner),
        data: { titleKey: 'nav.planner' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then((m) => m.Profile),
        data: { titleKey: 'nav.profile' },
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
