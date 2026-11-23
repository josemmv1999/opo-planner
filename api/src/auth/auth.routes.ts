import { randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { Router, type Response } from 'express';
import { hashPassword, verifyPassword } from '../password.ts';
import { isFilled } from '../validation.ts';
import { requireUser, SESSION_COOKIE, type AuthenticatedResponse } from './require-user.ts';
import { toUser, type UserRow } from './user.ts';

export const authRoutes = (database: DatabaseSync): Router => {
  const findUser = database.prepare('SELECT * FROM users WHERE email = ?');
  const insertUser = database.prepare(
    'INSERT INTO users (name, surname, email, password_hash) VALUES (?, ?, ?, ?) RETURNING *',
  );
  const insertSession = database.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
  const deleteSession = database.prepare('DELETE FROM sessions WHERE token = ?');

  const startSession = (res: Response, user: UserRow): void => {
    const token = randomBytes(32).toString('hex');
    insertSession.run(token, user.id);
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax' });
  };

  return Router()
    .post('/register', async (req, res) => {
      const { name, surname, email, password } = req.body ?? {};
      if (!isFilled(name, surname, email, password)) return void res.sendStatus(400);
      if (findUser.get(email)) return void res.sendStatus(409);
      const user = insertUser.get(
        name,
        surname,
        email,
        await hashPassword(password),
      ) as unknown as UserRow;
      startSession(res, user);
      res.status(201).json(toUser(user));
    })
    .post('/login', async (req, res) => {
      const { email, password } = req.body ?? {};
      if (!isFilled(email, password)) return void res.sendStatus(400);
      const user = findUser.get(email) as UserRow | undefined;
      if (!user || !(await verifyPassword(password, user.password_hash)))
        return void res.sendStatus(401);
      startSession(res, user);
      res.json(toUser(user));
    })
    .get('/me', requireUser(database), (_req, res: AuthenticatedResponse) => {
      res.json(toUser(res.locals.user));
    })
    .post('/logout', requireUser(database), (_req, res: AuthenticatedResponse) => {
      deleteSession.run(res.locals.token);
      res.clearCookie(SESSION_COOKIE).sendStatus(204);
    });
};
