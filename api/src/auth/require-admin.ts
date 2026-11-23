import type { NextFunction, Request } from 'express';
import type { AuthenticatedResponse } from './require-user.ts';

export const requireAdmin = (
  _req: Request,
  res: AuthenticatedResponse,
  next: NextFunction,
): void => (res.locals.user.is_admin ? next() : void res.sendStatus(403));
