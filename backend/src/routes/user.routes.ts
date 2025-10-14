import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { SelfChangeRoleSchema } from '../validations/user.schema';
import { changeMyRole, me } from '../controllers/user.controller';

const router = Router();

/** Ping opcional */
router.get('/ping', (_req, res) => res.json({ pong: true }));

/** Perfil del usuario autenticado */
router.get('/me', requireAuth, me);

/** Cambiar MI propio rol (cliente | administrador) */
router.patch(
  '/me/role',
  requireAuth,
  validate(SelfChangeRoleSchema),
  changeMyRole
);

export default router;
