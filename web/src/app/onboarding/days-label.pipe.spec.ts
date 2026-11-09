import { describe, expect, it } from 'vitest';
import { DaysLabelPipe } from './days-label.pipe';

const LABELS = {
  names: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
  range: '{{from}} a {{to}}',
  and: ' y ',
};

describe('DaysLabelPipe', () => {
  const pipe = new DaysLabelPipe();

  it('joins three or more consecutive days as a range', () => {
    expect(pipe.transform([0, 1, 2, 3, 4], LABELS)).toBe('lunes a viernes');
  });

  it('lists days that are not consecutive', () => {
    expect(pipe.transform([0, 2, 4], LABELS)).toBe('lunes, miércoles y viernes');
    expect(pipe.transform([5, 6], LABELS)).toBe('sábado y domingo');
    expect(pipe.transform([3], LABELS)).toBe('jueves');
  });

  it('returns an empty label while the translations are not loaded', () => {
    expect(pipe.transform([0], 'onboarding.schedule.dayLabels')).toBe('');
  });
});
