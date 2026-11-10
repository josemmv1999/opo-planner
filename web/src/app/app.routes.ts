import { Routes } from '@angular/router';
import { AppLayout } from './app-layout/app-layout';
import { AuthLayoutComponent } from './auth-layout/auth-layout';
import { ExamSession } from './exam-session/exam-session';
import { Exams } from './exams/exams';
import { Home } from './home/home';
import { Login } from './login/login';
import { Note } from './note/note';
import { Onboarding } from './onboarding/onboarding';
import { Planner } from './planner/planner';
import { Register } from './register/register';
import { Syllabus } from './syllabus/syllabus';
import { SyllabusTopic } from './syllabus-topic/syllabus-topic';

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
  { path: 'exams/:examId', component: ExamSession },
  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'home', component: Home },
      { path: 'syllabus', component: Syllabus, data: { titleKey: 'nav.syllabus' } },
      { path: 'syllabus/:topicId', component: SyllabusTopic, data: { titleKey: 'nav.syllabus' } },
      {
        path: 'syllabus/:topicId/notes/:noteId',
        component: Note,
        data: { titleKey: 'nav.syllabus' },
      },
      { path: 'exams', component: Exams, data: { titleKey: 'nav.exams' } },
      { path: 'planner', component: Planner, data: { titleKey: 'nav.planner' } },
    ],
  },
];
