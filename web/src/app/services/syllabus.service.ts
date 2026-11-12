import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, switchMap } from 'rxjs';
import { SyllabusBlock, SyllabusTopicDetail, TopicLaw } from '../../common/models/syllabus.model';
import { NotesService } from './notes.service';

const CONSTITUTION = 'BOE-A-1978-31229';
const PROCEDURE_LAW = 'BOE-A-2015-10565';
const PUBLIC_SECTOR_LAW = 'BOE-A-2015-10566';
const PUBLIC_EMPLOYEE_STATUTE = 'BOE-A-2015-11719';

const TOPIC_LAWS: Record<number, TopicLaw[]> = {
  1: [
    { name: 'Constitución Española', scope: 'Título Preliminar y Título I', boeId: CONSTITUTION },
  ],
  2: [{ name: 'Constitución Española', scope: 'Títulos II y III', boeId: CONSTITUTION }],
  3: [
    { name: 'Constitución Española', scope: 'Título IV', boeId: CONSTITUTION },
    { name: 'Ley 50/1997, del Gobierno', scope: 'Completa', boeId: 'BOE-A-1997-25336' },
  ],
  4: [
    {
      name: 'Ley 40/2015, de Régimen Jurídico del Sector Público',
      scope: 'Título preliminar',
      boeId: PUBLIC_SECTOR_LAW,
    },
  ],
  5: [
    {
      name: 'Ley 39/2015, del Procedimiento Administrativo Común',
      scope: 'Título III',
      boeId: PROCEDURE_LAW,
    },
  ],
  6: [
    {
      name: 'Ley 39/2015, del Procedimiento Administrativo Común',
      scope: 'Títulos IV y V',
      boeId: PROCEDURE_LAW,
    },
  ],
  7: [
    {
      name: 'Estatuto Básico del Empleado Público',
      scope: 'Títulos I y II',
      boeId: PUBLIC_EMPLOYEE_STATUTE,
    },
  ],
  8: [
    {
      name: 'Estatuto Básico del Empleado Público',
      scope: 'Título III',
      boeId: PUBLIC_EMPLOYEE_STATUTE,
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class SyllabusService {
  readonly #notesService = inject(NotesService);

  getBlocks(): Observable<SyllabusBlock[]> {
    return of<SyllabusBlock[]>([
      {
        id: 1,
        label: 'Bloque I',
        name: 'Organización del Estado',
        correctPercentage: null,
        isStudied: false,
        topics: [
          {
            id: 1,
            number: 1,
            name: 'La Constitución Española de 1978',
            correctPercentage: null,
            notesCount: 2,
          },
          {
            id: 2,
            number: 2,
            name: 'La Corona y las Cortes Generales',
            correctPercentage: null,
            notesCount: 0,
          },
          {
            id: 3,
            number: 3,
            name: 'El Gobierno y la Administración',
            correctPercentage: null,
            notesCount: 0,
          },
        ],
      },
      {
        id: 2,
        label: 'Bloque II',
        name: 'Procedimiento Administrativo',
        correctPercentage: null,
        isStudied: false,
        topics: [
          {
            id: 4,
            number: 4,
            name: 'Las fuentes del derecho administrativo',
            correctPercentage: null,
            notesCount: 1,
          },
          {
            id: 5,
            number: 5,
            name: 'El acto administrativo',
            correctPercentage: null,
            notesCount: 0,
          },
          {
            id: 6,
            number: 6,
            name: 'El procedimiento administrativo común',
            correctPercentage: null,
            notesCount: 0,
          },
        ],
      },
      {
        id: 3,
        label: 'Bloque III',
        name: 'Gestión de personal',
        correctPercentage: null,
        isStudied: false,
        topics: [
          {
            id: 7,
            number: 7,
            name: 'El personal al servicio de las Administraciones',
            correctPercentage: null,
            notesCount: 0,
          },
          {
            id: 8,
            number: 8,
            name: 'Derechos y deberes de los empleados públicos',
            correctPercentage: null,
            notesCount: 0,
          },
        ],
      },
      {
        id: 4,
        label: 'Bloque IV',
        name: 'Ofimática',
        correctPercentage: null,
        isStudied: false,
        topics: [
          {
            id: 9,
            number: 9,
            name: 'Procesador de textos',
            correctPercentage: null,
            notesCount: 0,
          },
          { id: 10, number: 10, name: 'Hojas de cálculo', correctPercentage: null, notesCount: 0 },
        ],
      },
    ]).pipe(
      map((blocks) => {
        const counts = this.#notesService.countByTopic();
        return blocks.map((block) => ({
          ...block,
          topics: block.topics.map((topic) => ({ ...topic, notesCount: counts[topic.id] ?? 0 })),
        }));
      }),
      delay(400),
    );
  }

  getTopic(topicId: number): Observable<SyllabusTopicDetail> {
    return this.getBlocks().pipe(
      switchMap((blocks) =>
        this.#notesService.getTopicNotes(topicId).pipe(
          map((notes) => {
            const block = blocks.find(({ topics }) => topics.some(({ id }) => id === topicId));
            const topic = block?.topics.find(({ id }) => id === topicId);
            if (!block || !topic) throw new Error('Topic not found');
            const topics = blocks.flatMap((current) => current.topics);
            const index = topics.findIndex(({ id }) => id === topicId);
            const toLink = (link?: { id: number; number: number; name: string }) =>
              link ? { id: link.id, number: link.number, name: link.name } : null;
            return {
              id: topic.id,
              number: topic.number,
              name: topic.name,
              blockLabel: block.label,
              blockName: block.name,
              correctPercentage: topic.correctPercentage,
              laws: TOPIC_LAWS[topic.id] ?? [],
              notes,
              previousTopic: toLink(topics[index - 1]),
              nextTopic: toLink(topics[index + 1]),
            };
          }),
        ),
      ),
    );
  }

  setStudied(
    blockId: number,
    isStudied: boolean,
  ): Observable<{ blockId: number; isStudied: boolean }> {
    return of({ blockId, isStudied }).pipe(delay(300));
  }
}
