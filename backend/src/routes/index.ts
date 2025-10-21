import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import complejosRoutes from './complejos.routes';
import canchasRoutes from './canchas.routes';
import horariosRoutes from './horarios.routes';
import reservasRoutes from './reservas.routes'

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', userRoutes);
router.use('/complejos', complejosRoutes);
router.use('/canchas', canchasRoutes);
router.use('/horarios', horariosRoutes);
router.use('/reservas', reservasRoutes);

// ping del router (para probar rápido)
router.get('/', (_req, res) => res.json({ ok: true, modules: ['auth','usuarios','complejos','canchas','horarios'] }));
export default router;
