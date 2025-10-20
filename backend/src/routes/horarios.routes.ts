import { Router } from 'express';
import { HorariosController } from '../controllers/horarios.controller';

const router = Router();

router.post('/', HorariosController.crear);
router.get('/cancha/:cancha_id/:fecha', HorariosController.listar); // fecha: YYYY-MM-DD
router.delete('/:id', HorariosController.eliminar);
router.post('/bulk', HorariosController.crearBulk);
router.put('/:id', HorariosController.editar);

export default router;
