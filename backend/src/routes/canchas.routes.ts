import { Router } from 'express';
import { CanchasController } from '../controllers/canchas.controller';
import { DisponibilidadController } from '../controllers/disponibilidad.controller';

const router = Router();

router.post('/', CanchasController.crear);
router.get('/complejo/:complejo_id', CanchasController.listarPorComplejo);
router.patch('/:id', CanchasController.actualizar);
router.delete('/:id', CanchasController.eliminar);

router.get('/disponibilidad/:cancha_id/:fecha', DisponibilidadController.disponibilidadDia);
router.get('/mias', CanchasController.misCanchas);   
router.get('/:id/detalle', CanchasController.detalle);
export default router;
