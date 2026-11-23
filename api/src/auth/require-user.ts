import type { DatabaseSync } from 'node:sqlite';
import type { NextFunction, Request, Response } from 'express';
import type { UserRow } from './user.ts';

export const SESSION_COOKIE = 'session';

export type AuthenticatedResponse = Response<unknown, { user: UserRow; token: string }>;

export const readSessionToken = (req: Request): string | undefined =>
  req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([name]) => name === SESSION_COOKIE)?.[1];

export const requireUser = (database: DatabaseSync) => {
  const findSessionUser = database.prepare(
    'SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?',
  );
  return (req: Request, res: AuthenticatedResponse, next: NextFunction): void => {
    const token = readSessionToken(req);
    const user = token ? (findSessionUser.get(token) as UserRow | undefined) : undefined;
    if (!token || !user) return void res.sendStatus(401);
    res.locals = { user, token };
    next();
  };
};
