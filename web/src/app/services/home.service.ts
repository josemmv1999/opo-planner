import { Injectable } from '@angular/core';
import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  formatISO,
  isWeekend,
  startOfToday,
  startOfWeek,
  subDays,
} from 'date-fns';
import { Observable, delay, of } from 'rxjs';
import { HomeData } from '../../common/models/home.model';

const todayAt = (hours: number, minutes = 0): string =>
  addMinutes(startOfToday(), hours * 60 + minutes).toISOString();

const thisWeekDays = (): Date[] => {
  const monday = startOfWeek(startOfToday(), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: monday, end: addDays(monday, 6) });
};

const daysAgo = (days: number): string =>
  formatISO(subDays(startOfToday(), days), { representation: 'date' });

@Injectable({ providedIn: 'root' })
export class HomeService {
  getHomeData(): Observable<HomeData> {
    return of({
      examDate: '2027-06-12',
      studyStartDate: daysAgo(70),
      tasks: [
        {
          id: 1,
          text: 'Repasar la Constitución',
          start: todayAt(9),
          end: todayAt(10, 30),
          isDone: true,
        },
        {
          id: 2,
          text: 'Simulacro de Procedimiento Administrativo',
          start: todayAt(11),
          end: todayAt(12),
          isDone: false,
        },
        {
          id: 3,
          text: 'Pasar a limpio los apuntes de Ofimática',
          start: todayAt(17),
          end: todayAt(18, 30),
          isDone: false,
        },
      ],
      mockExamLogs: [
        {
          id: 1,
          text: 'Simulacro · Tema 3, la Corona',
          start: todayAt(10, 35),
          end: todayAt(10, 58),
          correctAnswers: 8,
          totalQuestions: 10,
        },
      ],
      weekDaysWithTasks: thisWeekDays()
        .filter((day) => !isWeekend(day))
        .map((day) => formatISO(day, { representation: 'date' })),
      streakDays: 4,
      lastSevenDays: [
        { date: daysAgo(6), hasStudied: true },
        { date: daysAgo(5), hasStudied: false },
        { date: daysAgo(4), hasStudied: true },
        { date: daysAgo(3), hasStudied: true },
        { date: daysAgo(2), hasStudied: true },
        { date: daysAgo(1), hasStudied: true },
        { date: daysAgo(0), hasStudied: false },
      ],
      studiedBlocks: [
        { id: 1, name: 'Organización del Estado' },
        { id: 2, name: 'Derecho de la Unión Europea' },
      ],
      weakBlocks: [
        { id: 3, name: 'Procedimiento Administrativo', correctPercentage: 42 },
        { id: 4, name: 'Gestión de personal', correctPercentage: 55 },
        { id: 5, name: 'Ofimática', correctPercentage: 68 },
      ],
      statements: [
        {
          id: 1,
          text: 'La Constitución Española de 1978 consta de 169 artículos.',
          isTrue: true,
          explanation:
            'Tiene 169 artículos, además de disposiciones adicionales, transitorias, una derogatoria y una final.',
        },
        {
          id: 2,
          text: 'La Corona se regula en el Título Preliminar de la Constitución.',
          isTrue: false,
          explanation:
            'La Corona está en el Título II. El Título Preliminar recoge los principios básicos del Estado.',
        },
        {
          id: 3,
          text: 'La Ley 39/2015 regula el Procedimiento Administrativo Común de las Administraciones Públicas.',
          isTrue: true,
          explanation:
            'Es la ley del procedimiento común. El régimen jurídico del sector público está en la Ley 40/2015.',
        },
        {
          id: 4,
          text: 'El mandato de los diputados es de cinco años.',
          isTrue: false,
          explanation: 'El Congreso se elige por cuatro años (artículo 68.4 de la Constitución).',
        },
        {
          id: 5,
          text: 'La mayoría de edad se fija en la Constitución a los 18 años.',
          isTrue: true,
          explanation: 'Lo establece el artículo 12 de la Constitución.',
        },
        {
          id: 6,
          text: 'El Tribunal Constitucional se compone de 12 miembros.',
          isTrue: true,
          explanation:
            'Tiene 12 miembros nombrados por el Rey (artículo 159.1 de la Constitución).',
        },
        {
          id: 7,
          text: 'Los miembros del Tribunal Constitucional se designan por seis años.',
          isTrue: false,
          explanation:
            'Se designan por nueve años y se renuevan por terceras partes cada tres (artículo 159.3).',
        },
        {
          id: 8,
          text: 'El Senado es la cámara de representación territorial.',
          isTrue: true,
          explanation: 'Así lo define el artículo 69.1 de la Constitución.',
        },
        {
          id: 9,
          text: 'La Constitución se ratificó en referéndum el 6 de diciembre de 1978.',
          isTrue: true,
          explanation:
            'El referéndum fue el 6 de diciembre; el Rey la sancionó el 27 de diciembre de 1978.',
        },
        {
          id: 10,
          text: 'Un decreto-ley puede regular el régimen electoral general.',
          isTrue: false,
          explanation:
            'El artículo 86.1 de la Constitución prohíbe que los decretos-leyes afecten al derecho electoral general.',
        },
        {
          id: 11,
          text: 'Si la norma no fija otro plazo, el máximo para resolver y notificar es de tres meses.',
          isTrue: true,
          explanation: 'Es el plazo supletorio del artículo 21.3 de la Ley 39/2015.',
        },
        {
          id: 12,
          text: 'El recurso de alzada lo resuelve el mismo órgano que dictó el acto.',
          isTrue: false,
          explanation:
            'Lo resuelve el órgano superior jerárquico (artículo 121 de la Ley 39/2015). El que resuelve el mismo órgano es el de reposición.',
        },
        {
          id: 13,
          text: 'El Rey es el Jefe del Estado.',
          isTrue: true,
          explanation: 'Lo dice el artículo 56.1 de la Constitución.',
        },
        {
          id: 14,
          text: 'El Defensor del Pueblo lo nombra el Gobierno.',
          isTrue: false,
          explanation:
            'Lo designan las Cortes Generales, de las que es alto comisionado (artículo 54 de la Constitución).',
        },
        {
          id: 15,
          text: 'La Ley 40/2015 regula el Régimen Jurídico del Sector Público.',
          isTrue: true,
          explanation:
            'Así es. El procedimiento administrativo común se regula aparte, en la Ley 39/2015.',
        },
      ],
    }).pipe(delay(800));
  }
}
