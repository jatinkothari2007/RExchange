import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { dataStore } from '../data/store';
import { User } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'rexchange_dev_super_secret_jwt_access_key_2026_sih';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { sub: string; email: string };
    const user = dataStore.users.get(payload.sub);
    if (!user) {
      return next(new UnauthorizedError('User referenced in token no longer exists'));
    }
    req.user = user;
    return next();
  } catch (err: any) {
    return next(new UnauthorizedError('Token is expired or invalid'));
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { sub: string };
      const user = dataStore.users.get(payload.sub);
      if (user) {
        req.user = user;
      }
    } catch {
      // ignore in optionalAuth
    }
  }
  return next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin privileges required for this action'));
  }
  return next();
};
