import { Router } from 'express';
import { ComplejosController } from '../controllers/complejos.controller';

const router = Router();

// Crear complejo (acepta canchas anidadas)
router.post('/', ComplejosController.crear);

// Listar complejos (con filtros ciudad/nombre) — útil para tarjetas
router.get('/', ComplejosController.listar);

// Listar por admin (si tu UI lo necesita)
router.get('/admin/:admin_id', ComplejosController.listarPorAdmin);

// Detalle
router.get('/:id', ComplejosController.obtener);

router.patch('/:id', ComplejosController.actualizar);
export default router;
