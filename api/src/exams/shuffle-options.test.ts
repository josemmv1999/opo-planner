import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shuffleOptions } from './shuffle-options.ts';

const sequence =
  (...values: number[]) =>
  () =>
    values.shift() ?? 0;

test('moves the options and follows the correct one', () => {
  const { options, correctOption } = shuffleOptions(['A', 'B', 'C', 'D'], 0, sequence(0, 0, 0));
  assert.deepEqual(options, ['B', 'C', 'D', 'A']);
  assert.equal(options[correctOption ?? -1], 'A');
});

test('keeps the options that refer to the others in place', () => {
  const { options, correctOption } = shuffleOptions(
    ['A', 'B', 'C', 'Todas las anteriores son correctas.'],
    3,
    sequence(0, 0),
  );
  assert.deepEqual(options, ['B', 'C', 'A', 'Todas las anteriores son correctas.']);
  assert.equal(correctOption, 3);
  assert.deepEqual(
    shuffleOptions(['A', 'B', 'Las respuestas a) y b) son correctas.', 'D'], 1, sequence(0, 0))
      .options[2],
    'Las respuestas a) y b) son correctas.',
  );
});

test('keeps a voided question without a correct option', () => {
  assert.equal(shuffleOptions(['A', 'B', 'C', 'D'], null).correctOption, null);
});

test('spreads the correct option over every position', () => {
  const positions = new Set(
    Array.from({ length: 200 }, () => shuffleOptions(['A', 'B', 'C', 'D'], 0).correctOption),
  );
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});
