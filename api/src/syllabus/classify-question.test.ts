import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyQuestion } from './classify-question.ts';

test('uses the cited article of the Constitution', () => {
  assert.equal(
    classifyQuestion(
      'Corresponde al Rey, conforme al artículo 62 de la Constitución Española de 1978:',
    ),
    2,
  );
  assert.equal(
    classifyQuestion('De acuerdo con el artículo 67 de la Constitución Española de 1978:'),
    3,
  );
  assert.equal(
    classifyQuestion(
      'De acuerdo con el artículo 167 de la Constitución Española de 1978, los proyectos de reforma',
    ),
    1,
  );
});

test('uses the cited law and its article ranges', () => {
  assert.equal(
    classifyQuestion(
      'Conforme al artículo 32.8 de la Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público',
    ),
    21,
  );
  assert.equal(
    classifyQuestion(
      'Según el artículo 16 de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común',
    ),
    13,
  );
  assert.equal(
    classifyQuestion(
      'De acuerdo con el artículo 56 del Real Decreto Legislativo 5/2015, de 30 de octubre',
    ),
    24,
  );
  assert.equal(
    classifyQuestion(
      'Según el artículo 102 de la Ley 9/2017, de 8 de noviembre, de Contratos del Sector Público',
    ),
    19,
  );
});

test('prefers the first cited law', () => {
  assert.equal(
    classifyQuestion(
      'De acuerdo con el artículo 215 del Real Decreto Legislativo 8/2015, de 30 de octubre, en el supuesto del personal laboral sujeto al IV Convenio único',
    ),
    31,
  );
});

test('falls back to keywords and to null', () => {
  assert.equal(
    classifyQuestion('¿Cuántos objetivos de desarrollo sostenible contiene la Agenda 2030?'),
    6,
  );
  assert.equal(
    classifyQuestion('¿Qué función de Excel 365 invierte el valor lógico de su argumento?'),
    null,
  );
});
