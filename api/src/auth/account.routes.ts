import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { hashPassword, verifyPassword } from '../password.ts';
import { isFilled } from '../validation.ts';
import { requireUser, type AuthenticatedResponse } from './require-user.ts';
import { toUser, type UserRow } from './user.ts';

export const accountRoutes = (database: DatabaseSync): Router => {
  const completeOnboarding = database.prepare(
    'UPDATE users SET has_completed_onboarding = 1 WHERE id = ?',
  );
  const findOtherUser = database.prepare('SELECT id FROM users WHERE email = ? AND id != ?');
  const updateProfile = database.prepare(
    'UPDATE users SET name = ?, surname = ?, email = ? WHERE id = ? RETURNING *',
  );
  const updatePassword = database.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  const findOppositions = database.prepare(
    'SELECT opposition_ids, active_opposition_id FROM users WHERE id = ?',
  );
  const updateOppositions = database.prepare('UPDATE users SET opposition_ids = ? WHERE id = ?');
  const updateActiveOpposition = database.prepare(
    'UPDATE users SET active_opposition_id = ? WHERE id = ?',
  );

  const oppositionsOf = (userId: number) => {
    const row = findOppositions.get(userId) as {
      opposition_ids: string | null;
      active_opposition_id: string | null;
    };
    return {
      ids: row.opposition_ids ? (JSON.parse(row.opposition_ids) as string[]) : null,
      activeId: row.active_opposition_id,
    };
  };

  return Router()
    .use(requireUser(database))
    .post('/onboarding', (_req, res: AuthenticatedResponse) => {
      completeOnboarding.run(res.locals.user.id);
      res.sendStatus(204);
    })
    .get('/oppositions', (_req, res: AuthenticatedResponse) => {
      res.json(oppositionsOf(res.locals.user.id));
    })
    .put('/oppositions', (req, res: AuthenticatedResponse) => {
      const { ids } = req.body ?? {};
      if (!Array.isArray(ids) || !ids.length || !ids.every((id) => isFilled(id)))
        return void res.sendStatus(400);
      updateOppositions.run(JSON.stringify([...new Set(ids)]), res.locals.user.id);
      res.json(oppositionsOf(res.locals.user.id));
    })
    .put('/oppositions/active', (req, res: AuthenticatedResponse) => {
      const { id } = req.body ?? {};
      if (!isFilled(id)) return void res.sendStatus(400);
      updateActiveOpposition.run(id, res.locals.user.id);
      res.json(oppositionsOf(res.locals.user.id));
    })
    .put('/profile', (req, res: AuthenticatedResponse) => {
      const { name, surname, email } = req.body ?? {};
      if (!isFilled(name, surname, email)) return void res.sendStatus(400);
      if (findOtherUser.get(email, res.locals.user.id)) return void res.sendStatus(409);
      const user = updateProfile.get(
        name,
        surname,
        email,
        res.locals.user.id,
      ) as unknown as UserRow;
      res.json(toUser(user));
    })
    .put('/password', async (req, res: AuthenticatedResponse) => {
      const { currentPassword, newPassword } = req.body ?? {};
      if (!isFilled(currentPassword, newPassword)) return void res.sendStatus(400);
      if (!(await verifyPassword(currentPassword, res.locals.user.password_hash)))
        return void res.sendStatus(403);
      updatePassword.run(await hashPassword(newPassword), res.locals.user.id);
      res.sendStatus(204);
    });
};
