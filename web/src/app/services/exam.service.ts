import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ExamAttempt, OfficialExam } from '../../common/models/exam.model';

@Injectable({ providedIn: 'root' })
export class ExamService {
  getOfficialExams(): Observable<OfficialExam[]> {
    return of<OfficialExam[]>([
      { id: 2025, name: 'Convocatoria 2025', questionCount: 60, minutes: 60, lastPercentage: null },
      { id: 2024, name: 'Convocatoria 2024', questionCount: 60, minutes: 60, lastPercentage: 72 },
      { id: 2023, name: 'Convocatoria 2023', questionCount: 60, minutes: 60, lastPercentage: 64 },
    ]).pipe(delay(300));
  }

  getHistory(): Observable<ExamAttempt[]> {
    return of<ExamAttempt[]>([
      {
        id: 3,
        kind: 'mixed',
        name: 'Batiburrillo',
        date: '2026-11-08',
        minutesTaken: 52,
        percentage: 68,
      },
      {
        id: 2,
        kind: 'official',
        name: 'Convocatoria 2024',
        date: '2026-11-02',
        minutesTaken: 58,
        percentage: 72,
      },
      {
        id: 1,
        kind: 'official',
        name: 'Convocatoria 2023',
        date: '2026-10-25',
        minutesTaken: 60,
        percentage: 64,
      },
    ]).pipe(delay(300));
  }
}
