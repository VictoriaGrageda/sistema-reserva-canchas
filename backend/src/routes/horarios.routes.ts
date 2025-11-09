import { Router } from 'express';
import { HorariosController } from '../controllers/horarios.controller';

const router = Router();

router.post('/', HorariosController.crear);
router.get('/cancha/:cancha_id/:fecha', HorariosController.listar); // fecha: YYYY-MM-DD
router.delete('/:id', HorariosController.eliminar);
router.post('/bulk', HorariosController.crearBulk);
router.put('/:id', HorariosController.editar);

// 🆕 Nuevas rutas para el sistema automático
router.post('/generar-bloques', HorariosController.generarBloques);
router.post('/configuraciones/:cancha_id', HorariosController.guardarConfiguraciones);
router.get('/configuraciones/:cancha_id', HorariosController.obtenerConfiguraciones);
router.patch('/disponibilidad', HorariosController.cambiarDisponibilidad);

export default router;
