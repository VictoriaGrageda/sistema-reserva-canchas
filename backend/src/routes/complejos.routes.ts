import { Router } from 'express';
import { ComplejosController } from '../controllers/complejos.controller';

const router = Router();

router.post('/', ComplejosController.crear);
router.get('/admin/:admin_id', ComplejosController.listarPorAdmin);
router.get('/:id', ComplejosController.obtener);

export default router;
