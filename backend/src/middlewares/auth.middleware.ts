// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';

export type AuthedRequest = Request & { user?: JwtPayload & { sub?: string; id?: string }, userId?: string };

export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Falta token. Usa Header Authorization: Bearer <token>' });
  }
  const token = auth.slice(7);

  try {
    // DEBUG opcional:
    // console.log('[AUTH] token len:', token.length, token.slice(0,20)+'...');

    const payload = verifyToken<JwtPayload & { sub?: string; id?: string }>(token);
    req.user = payload;
    req.userId = payload.sub ?? payload.id;
    if (!req.userId) return res.status(401).json({ message: 'Token sin identificador (sub/id)' });
    return next();
  } catch (e: any) {
    // console.error('[AUTH] verify error:', e?.name, e?.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
