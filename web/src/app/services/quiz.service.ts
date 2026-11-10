import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { QuizQuestion } from '../../common/models/quiz.model';

const QUESTION_BANK: Omit<QuizQuestion, 'id'>[] = [
  {
    caseText: null,
    statement: '¿Cuántos artículos tiene la Constitución Española de 1978?',
    options: ['155', '169', '176', '184'],
    correctOption: 1,
    reasoning:
      'Tiene 169 artículos, además de disposiciones adicionales, transitorias, una derogatoria y una final.',
  },
  {
    caseText: null,
    statement: '¿En qué título de la Constitución se regula la Corona?',
    options: ['Título Preliminar', 'Título I', 'Título II', 'Título III'],
    correctOption: 2,
    reasoning:
      'La Corona está en el Título II (artículos 56 a 65). El Título Preliminar recoge los principios básicos del Estado.',
  },
  {
    caseText:
      'Ana presenta una solicitud el 3 de marzo ante un ministerio. La norma del procedimiento no fija plazo para resolver y la Administración no le ha notificado nada.',
    statement: '¿Cuándo vence el plazo máximo para resolver y notificar?',
    options: ['A los tres meses', 'A los seis meses', 'Al año', 'No hay plazo'],
    correctOption: 0,
    reasoning:
      'Si la norma no fija plazo, es de tres meses (artículo 21.3 de la Ley 39/2015), contados desde la entrada de la solicitud en el registro del órgano competente.',
  },
  {
    caseText: null,
    statement: '¿Cuánto dura el mandato de los diputados?',
    options: ['Dos años', 'Cuatro años', 'Cinco años', 'Seis años'],
    correctOption: 1,
    reasoning: 'El Congreso se elige por cuatro años (artículo 68.4 de la Constitución).',
  },
  {
    caseText: null,
    statement: '¿A qué edad se fija la mayoría de edad en la Constitución?',
    options: ['16 años', '17 años', '18 años', '21 años'],
    correctOption: 2,
    reasoning: 'Lo establece el artículo 12 de la Constitución.',
  },
];

@Injectable({ providedIn: 'root' })
export class QuizService {
  getTopicQuestions(topicId: number, count: number): Observable<QuizQuestion[]> {
    const questions = Array.from({ length: count }, (_, i) => ({
      id: topicId * 1000 + i,
      ...QUESTION_BANK[(topicId + i) % QUESTION_BANK.length],
    }));
    return of(questions).pipe(delay(300));
  }
}
