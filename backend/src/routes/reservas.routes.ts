import { Router } from 'express';
import { ReservasController } from '../controllers/reservas.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  CrearReservaSchema,
  ModificarReservaSchema,
  CambiarEstadoReservaSchema,
} from '../validations/reservas.schema';

const router = Router();

// ==================== Rutas de Cliente ====================

/**
 * POST /api/v1/reservas
 * Crear una nueva reserva
 * Requiere autenticación
 */
router.post(
  '/',
  requireAuth,
  validate(CrearReservaSchema),
  ReservasController.crear
);

/**
 * GET /api/v1/reservas/mis-reservas
 * Obtener historial de reservas del usuario autenticado
 * Query params opcionales: ?estado=pendiente&limit=20&offset=0
 */
router.get(
  '/mis-reservas',
  requireAuth,
  ReservasController.misReservas
);

/**
 * GET /api/v1/reservas/:id
 * Obtener detalle de una reserva específica
 * Solo puede ver sus propias reservas
 */
router.get(
  '/:id',
  requireAuth,
  ReservasController.obtenerDetalle
);

/**
 * PATCH /api/v1/reservas/:id
 * Modificar una reserva (cambiar horarios)
 * Solo si está en estado "pendiente"
 */
router.patch(
  '/:id',
  requireAuth,
  validate(ModificarReservaSchema),
  ReservasController.modificar
);

/**
 * DELETE /api/v1/reservas/:id
 * Cancelar una reserva
 */
router.delete(
  '/:id',
  requireAuth,
  ReservasController.cancelar
);

// ==================== Rutas de Administrador ====================

/**
 * GET /api/v1/reservas/admin/panel
 * Panel de administrador - ver reservas de sus complejos
 * Query params: ?complejo_id=uuid&estado=pendiente&fecha=2024-10-20
 * Requiere rol: administrador
 */
router.get(
  '/admin/panel',
  requireAuth,
  ReservasController.panelAdmin
);

/**
 * PATCH /api/v1/reservas/:id/estado
 * Cambiar estado de una reserva (confirmar o cancelar)
 * Body: { estado: "confirmada" | "cancelada" }
 * Requiere rol: administrador
 */
router.patch(
  '/:id/estado',
  requireAuth,
  validate(CambiarEstadoReservaSchema),
  ReservasController.cambiarEstado
);

export default router;
