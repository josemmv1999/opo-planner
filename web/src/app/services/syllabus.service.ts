import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, forkJoin, map, of, switchMap } from 'rxjs';
import { SyllabusBlock, SyllabusTopicDetail, TopicLaw } from '../../common/models/syllabus.model';
import { NotesService } from './notes.service';

const CONSTITUTION = 'BOE-A-1978-31229';
const PROCEDURE_LAW = 'BOE-A-2015-10565';
const PUBLIC_SECTOR_LAW = 'BOE-A-2015-10566';
const PUBLIC_EMPLOYEE_STATUTE = 'BOE-A-2015-11719';

const law =
  (name: string, boeId: string) =>
  (scope: string): TopicLaw => ({ name, scope, boeId });
const constitution = law('Constitución Española', CONSTITUTION);
const procedureLaw = law('Ley 39/2015, del Procedimiento Administrativo Común', PROCEDURE_LAW);
const publicSectorLaw = law(
  'Ley 40/2015, de Régimen Jurídico del Sector Público',
  PUBLIC_SECTOR_LAW,
);
const employeeStatute = law('Estatuto Básico del Empleado Público', PUBLIC_EMPLOYEE_STATUTE);

const TOPIC_LAWS: Record<number, TopicLaw[]> = {
  1: [constitution('Títulos Preliminar, I, IX y X')],
  2: [constitution('Título II')],
  3: [constitution('Título III')],
  4: [constitution('Título VI')],
  5: [
    constitution('Títulos IV y V'),
    law('Ley 50/1997, del Gobierno', 'BOE-A-1997-25336')('Completa'),
  ],
  9: [constitution('Título VIII')],
  17: [procedureLaw('Título III')],
  18: [procedureLaw('Completa'), publicSectorLaw('Título preliminar')],
  23: [employeeStatute('Completo')],
  25: [employeeStatute('Título II')],
  26: [employeeStatute('Títulos IV y VI')],
  27: [employeeStatute('Títulos III y V')],
  28: [employeeStatute('Título VII')],
};

interface ApiSyllabusBlock {
  id: number;
  label: string;
  name: string;
  topics: { id: number; number: number; name: string }[];
}

@Injectable({ providedIn: 'root' })
export class SyllabusService {
  readonly #http = inject(HttpClient);
  readonly #notesService = inject(NotesService);

  getBlocks(): Observable<SyllabusBlock[]> {
    return forkJoin([
      this.#http.get<ApiSyllabusBlock[]>('/api/syllabus'),
      this.#notesService.countByTopic(),
    ]).pipe(
      map(([blocks, counts]) => {
        return blocks.map(({ id, label, name, topics }) => ({
          id,
          label,
          name,
          correctPercentage: null,
          isStudied: false,
          topics: topics.map(({ id, number, name }) => ({
            id,
            number,
            name,
            correctPercentage: null,
            notesCount: counts[id] ?? 0,
          })),
        }));
      }),
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
