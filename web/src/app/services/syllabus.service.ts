import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { SyllabusBlock } from '../../common/models/syllabus.model';

@Injectable({ providedIn: 'root' })
export class SyllabusService {
  getBlocks(): Observable<SyllabusBlock[]> {
    return of<SyllabusBlock[]>([
      {
        id: 1,
        label: 'Bloque I',
        name: 'Organización del Estado',
        correctPercentage: 82,
        isStudied: true,
        topics: [
          {
            id: 1,
            number: 1,
            name: 'La Constitución Española de 1978',
            correctPercentage: 88,
            notesCount: 2,
          },
          {
            id: 2,
            number: 2,
            name: 'La Corona y las Cortes Generales',
            correctPercentage: 79,
            notesCount: 0,
          },
          {
            id: 3,
            number: 3,
            name: 'El Gobierno y la Administración',
            correctPercentage: 80,
            notesCount: 0,
          },
        ],
      },
      {
        id: 2,
        label: 'Bloque II',
        name: 'Procedimiento Administrativo',
        correctPercentage: 42,
        isStudied: false,
        topics: [
          {
            id: 4,
            number: 4,
            name: 'Las fuentes del derecho administrativo',
            correctPercentage: 50,
            notesCount: 1,
          },
          {
            id: 5,
            number: 5,
            name: 'El acto administrativo',
            correctPercentage: 38,
            notesCount: 0,
          },
          {
            id: 6,
            number: 6,
            name: 'El procedimiento administrativo común',
            correctPercentage: 39,
            notesCount: 0,
          },
        ],
      },
      {
        id: 3,
        label: 'Bloque III',
        name: 'Gestión de personal',
        correctPercentage: 55,
        isStudied: false,
        topics: [
          {
            id: 7,
            number: 7,
            name: 'El personal al servicio de las Administraciones',
            correctPercentage: 55,
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
    ]).pipe(delay(400));
  }

  setStudied(
    blockId: number,
    isStudied: boolean,
  ): Observable<{ blockId: number; isStudied: boolean }> {
    return of({ blockId, isStudied }).pipe(delay(300));
  }
}
