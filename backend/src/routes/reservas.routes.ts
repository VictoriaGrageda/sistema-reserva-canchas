import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { ReservasController } from '../controllers/reservas.controller';

const router = Router();

// Cliente
router.post('/', requireAuth, ReservasController.crear);
router.get('/mias', requireAuth, ReservasController.misReservas);
router.get('/:id', requireAuth, ReservasController.detalle);
router.delete('/:id', requireAuth, ReservasController.cancelar);

export default router;
