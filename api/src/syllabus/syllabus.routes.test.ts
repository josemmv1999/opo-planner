import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startTestServer } from '../testing.ts';

const { request, signUp } = startTestServer();

test('returns the syllabus blocks with their topics in order', async () => {
  const cookie = await signUp('ana@example.com');
  const blocks = await (await request('/api/syllabus', { cookie })).json();
  assert.equal(blocks.length, 6);
  assert.deepEqual(
    { ...blocks[0], topics: blocks[0].topics.slice(0, 1) },
    {
      id: 1,
      label: 'Bloque I',
      name: 'Organización del Estado y de la Administración pública',
      topics: [
        {
          id: 1,
          number: 1,
          name: 'La Constitución Española de 1978: estructura y contenido',
          description:
            'La Constitución Española de 1978: estructura y contenido. Derechos y deberes fundamentales. Su garantía y suspensión. El Tribunal Constitucional. El Defensor del Pueblo. Reforma de la Constitución.',
        },
      ],
    },
  );
});

test('returns the Fuengirola syllabus reusing the shared AGE topics', async () => {
  const cookie = await signUp('fuengirola@example.com');
  await request('/api/account/oppositions', {
    method: 'PUT',
    cookie,
    body: JSON.stringify({ ids: ['ayto-fuengirola-c1'] }),
  });
  const blocks = await (await request('/api/syllabus', { cookie })).json();
  assert.deepEqual(
    blocks.map(({ label, topics }: { label: string; topics: unknown[] }) => [label, topics.length]),
    [
      ['Bloque A', 19],
      ['Bloque B', 22],
    ],
  );
  assert.deepEqual(
    blocks[0].topics.slice(0, 3).map(({ id, number }: { id: number; number: number }) => [id, number]),
    [
      [1, 1],
      [2, 2],
      [46, 3],
    ],
  );
  assert.equal(blocks[0].topics[0].name, 'La Constitución española de 1978');
});

test('needs a session', async () => {
  assert.equal((await request('/api/syllabus')).status, 401);
});
