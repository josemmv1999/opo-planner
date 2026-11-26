import { OppositionOption } from '../../common/models/onboarding.model';

export const OPPOSITION_CATALOG: OppositionOption[] = [
  {
    id: 'age-c1',
    level: 'C1',
    name: 'Administrativo de la AGE',
    body: 'Administración General del Estado',
  },
  {
    id: 'ayto-fuengirola-c1',
    level: 'C1',
    name: 'Administrativo del Ayuntamiento de Fuengirola',
    body: 'Administración Local',
  },
  {
    id: 'age-c2',
    level: 'C2',
    name: 'Auxiliar Administrativo de la AGE',
    body: 'Administración General del Estado',
    isHidden: true,
  },
  {
    id: 'ss-c1',
    level: 'C1',
    name: 'Administrativo de la Seguridad Social',
    body: 'Seguridad Social',
    isHidden: true,
  },
  {
    id: 'ss-c2',
    level: 'C2',
    name: 'Auxiliar Administrativo de la Seguridad Social',
    body: 'Seguridad Social',
    isHidden: true,
  },
];

export const VISIBLE_OPPOSITIONS = OPPOSITION_CATALOG.filter(({ isHidden }) => !isHidden);
