import { parseOfficialExam } from './parse-official-exam';

const QUESTIONNAIRE = `2025 - ADVO-L – MODELO A Página 1 de 14
PRIMERA PARTE
1. Corresponde al Rey, conforme al artículo 62 de la Constitución
Española de 1978:
a) Aprobar los Decretos Leyes. b) Aprobar los Reglamentos.
c) Aprobar las Leyes. d) Sancionar y promulgar las leyes.
2. ¿Cuántos objetivos de desarrollo sostenible contiene la Agenda 2030?
a) Diecisiete objetivos.
b) Dieciocho objetivos.
c) Diecinueve objetivos, según la
resolución de Naciones Unidas.
d) Veinte objetivos.
2025 - ADVO-L – MODELO A Página 2 de 14
Preguntas de reserva
1. ¿Quién es el supremo órgano consultivo del Gobierno?
a) El Congreso. b) El Consejo Supremo.
c) El Consejo de Estado. d) La Comisión Consultiva.
SUPUESTO I
Doña Clara presenta una solicitud
ante la Confederación.
Se plantean las siguientes cuestiones:
1. Si no aporta la firma:
a) Renuncia. b) Desiste.
c) Caduca. d) Nada.
2. ¿Qué plazo tiene?
a) Diez días. b) Quince días.
c) Un mes.`;

const ANSWER_KEY = `PLANTILLA DEFINITIVA DE RESPUESTAS
Primera parte
1. d
2. ANULADA
Preguntas de reserva
1. c
Supuesto I
1. b
2. a
3. c`;

const CASE_TEXT = 'Doña Clara presenta una solicitud ante la Confederación.';

describe('parseOfficialExam', () => {
  const { questions, errors } = parseOfficialExam(QUESTIONNAIRE, ANSWER_KEY);

  it('reads statements and options, joining wrapped lines and splitting options on one line', () => {
    expect(questions[0]).toEqual({
      section: 'PRIMERA PARTE',
      number: 1,
      isReserve: false,
      caseText: null,
      statement: 'Corresponde al Rey, conforme al artículo 62 de la Constitución Española de 1978:',
      options: [
        'Aprobar los Decretos Leyes.',
        'Aprobar los Reglamentos.',
        'Aprobar las Leyes.',
        'Sancionar y promulgar las leyes.',
      ],
      correctOption: 3,
      isVoided: false,
      topicId: null,
    });
    expect(questions[1].options[2]).toBe(
      'Diecinueve objetivos, según la resolución de Naciones Unidas.',
    );
  });

  it('marks voided questions', () => {
    expect(questions[1]).toMatchObject({ correctOption: null, isVoided: true });
  });

  it('keeps reserve questions apart from the main ones', () => {
    expect(questions[2]).toMatchObject({ number: 1, isReserve: true, correctOption: 2 });
  });

  it('attaches the case text to every question of a case', () => {
    expect(questions.slice(3).map(({ caseText }) => caseText)).toEqual([CASE_TEXT, CASE_TEXT]);
    expect(questions[3]).toMatchObject({ section: 'SUPUESTO I', number: 1, correctOption: 1 });
  });

  it('reports questions without four options and answers without a question', () => {
    expect(errors).toEqual([
      { kind: 'optionCount', section: 'SUPUESTO I', number: 2, isReserve: false },
      { kind: 'missingQuestion', section: 'Supuesto I', number: 3, isReserve: false },
    ]);
  });

  it('reports questions without an answer', () => {
    expect(parseOfficialExam(QUESTIONNAIRE, 'Primera parte\n1. d').errors).toContainEqual({
      kind: 'missingAnswer',
      section: 'PRIMERA PARTE',
      number: 2,
      isReserve: false,
    });
  });
});
