import { Router } from 'express';
import { CanchasController } from '../controllers/canchas.controller';

const router = Router();

router.post('/', CanchasController.crear);
router.get('/complejo/:complejo_id', CanchasController.listarPorComplejo);
router.patch('/:id', CanchasController.actualizar);
router.delete('/:id', CanchasController.eliminar);

export default router;
