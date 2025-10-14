import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';

export type AuthedRequest = Request & { user?: JwtPayload };

/**
 * Middleware para proteger rutas con JWT
 */
export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) return res.status(401).json({ message: 'Falta token' });

  try {
    const payload = verifyToken<JwtPayload>(token); // payload: { sub: userId, rol, ... }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
