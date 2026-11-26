import { describe, expect, it } from 'vitest';
import { changeNoteMark } from './note-marks';

const HTML =
  '<p>El <mark>plazo</mark> es de <u class="note-mark note-mark--blue" title="Ojo">diez días</u>.</p>';

describe('changeNoteMark', () => {
  it('changes the colour and the style of a mark and keeps its comment', () => {
    expect(changeNoteMark(HTML, 1, { color: 'pink', style: 'highlight' })).toBe(
      '<p>El <mark>plazo</mark> es de <mark class="note-mark note-mark--pink" title="Ojo">diez días</mark>.</p>',
    );
  });

  it('writes a comment on an old mark without colour', () => {
    expect(changeNoteMark(HTML, 0, { comment: 'Cae en el examen' })).toContain(
      '<mark class="note-mark note-mark--yellow" title="Cae en el examen">plazo</mark>',
    );
  });

  it('removes a mark and keeps its text', () => {
    expect(changeNoteMark(HTML, 1, null)).toBe('<p>El <mark>plazo</mark> es de diez días.</p>');
  });

  it('leaves the content alone when the mark does not exist', () => {
    expect(changeNoteMark(HTML, 5, null)).toBe(HTML);
  });
});
