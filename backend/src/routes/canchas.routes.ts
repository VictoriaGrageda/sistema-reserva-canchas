import { Router } from 'express';
import { CanchasController } from '../controllers/canchas.controller';
import { DisponibilidadController } from '../controllers/disponibilidad.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas que requieren autenticación
router.post('/', requireAuth, CanchasController.crear);
router.get('/mias', requireAuth, CanchasController.misCanchas);
router.patch('/:id', requireAuth, CanchasController.actualizar);
router.delete('/:id', requireAuth, CanchasController.eliminar);

// Rutas públicas (disponibilidad, detalle, listar por complejo, listar individuales)
router.get('/individuales', CanchasController.listarIndividuales);
router.get('/complejo/:complejo_id', CanchasController.listarPorComplejo);
router.get('/disponibilidad/:cancha_id/:fecha', DisponibilidadController.disponibilidadDia);
router.get('/:id/detalle', CanchasController.detalle);

export default router;
