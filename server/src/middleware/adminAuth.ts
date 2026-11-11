import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function passwordMatches(password: string) {
  const left = Buffer.from(password);
  const right = Buffer.from(env.adminPassword);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new Error('Invalid role');
    next();
  } catch {
    res.status(401).json({ error: 'Administrator login required' });
  }
}
