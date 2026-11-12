import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '../common/guards/auth.guard';
import { AppLayout } from './app-layout/app-layout';
import { AuthLayoutComponent } from './auth-layout/auth-layout';
import { ExamSession } from './exam-session/exam-session';
import { Exams } from './exams/exams';
import { Home } from './home/home';
import { Login } from './login/login';
import { Note } from './note/note';
import { Onboarding } from './onboarding/onboarding';
import { Planner } from './planner/planner';
import { Profile } from './profile/profile';
import { Register } from './register/register';
import { Syllabus } from './syllabus/syllabus';
import { SyllabusTopic } from './syllabus-topic/syllabus-topic';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  { path: 'onboarding', component: Onboarding, canActivate: [authGuard] },
  { path: 'exams/:examId', component: ExamSession, canActivate: [authGuard] },
  { path: 'syllabus/:topicId/notes/:noteId', component: Note, canActivate: [authGuard] },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'syllabus', component: Syllabus, data: { titleKey: 'nav.syllabus' } },
      { path: 'syllabus/:topicId', component: SyllabusTopic, data: { titleKey: 'nav.syllabus' } },
      { path: 'exams', component: Exams, data: { titleKey: 'nav.exams' } },
      { path: 'planner', component: Planner, data: { titleKey: 'nav.planner' } },
      { path: 'profile', component: Profile, data: { titleKey: 'nav.profile' } },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
