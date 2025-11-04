// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';

export type AuthedRequest = Request & { user?: JwtPayload, userId?: string };

export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Falta token. Usa Header Authorization: Bearer <token>' });
  }
  const token = auth.slice(7);

  try {
    const payload = verifyToken<JwtPayload>(token);
    req.user = payload;
    req.userId = payload.id;

    if (!req.userId) {
      return res.status(401).json({ message: 'Token sin identificador (id)' });
    }

    return next();
  } catch (e: any) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
