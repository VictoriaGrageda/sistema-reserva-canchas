import { Router } from 'express';
import { PagosController } from '../controllers/pagos.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  MarcarPagoRealizadoSchema,
  CambiarEstadoPagoSchema,
  FiltrosPagosSchema,
} from '../validations/pagos.schema';

const router = Router();

// ==================== Rutas de Cliente ====================

/**
 * GET /api/v1/pagos/reserva/:reserva_id
 * Obtener el pago de una reserva
 * Requiere autenticación (debe ser el dueño de la reserva)
 */
router.get(
  '/reserva/:reserva_id',
  requireAuth,
  PagosController.obtenerPorReserva
);

/**
 * GET /api/v1/pagos/reserva/:reserva_id/qr
 * Obtener el QR para realizar el pago de una reserva
 * No requiere autenticación (para facilitar compartir)
 */
router.get(
  '/reserva/:reserva_id/qr',
  PagosController.obtenerQRParaPago
);

/**
 * POST /api/v1/pagos/reserva/:reserva_id/marcar-realizado
 * Cliente marca que realizó el pago
 * Body: { qr_id?: string }
 * Requiere autenticación
 */
router.post(
  '/reserva/:reserva_id/marcar-realizado',
  requireAuth,
  validate(MarcarPagoRealizadoSchema),
  PagosController.marcarRealizado
);

// ==================== Rutas de Administrador ====================

/**
 * GET /api/v1/pagos/admin
 * Listar pagos del administrador con filtros
 * Query params: ?estado=pendiente&complejo_id=uuid
 * Requiere rol: administrador
 */
router.get(
  '/admin',
  requireAuth,
  PagosController.listarPorAdmin
);

/**
 * GET /api/v1/pagos/admin/pendientes
 * Listar pagos pendientes de confirmación
 * Requiere rol: administrador
 */
router.get(
  '/admin/pendientes',
  requireAuth,
  PagosController.listarPendientes
);

/**
 * GET /api/v1/pagos/:id
 * Obtener detalle de un pago específico
 * Requiere rol: administrador
 */
router.get(
  '/:id',
  requireAuth,
  PagosController.obtenerPorId
);

/**
 * PATCH /api/v1/pagos/:id/confirmar
 * Confirmar un pago (cambia reserva a "confirmada")
 * Requiere rol: administrador
 */
router.patch(
  '/:id/confirmar',
  requireAuth,
  PagosController.confirmar
);

/**
 * PATCH /api/v1/pagos/:id/rechazar
 * Rechazar un pago (cancela reserva y libera horarios)
 * Requiere rol: administrador
 */
router.patch(
  '/:id/rechazar',
  requireAuth,
  PagosController.rechazar
);

/**
 * PATCH /api/v1/pagos/:id/estado
 * Cambiar estado del pago (método genérico)
 * Body: { estado: "confirmado" | "rechazado" }
 * Requiere rol: administrador
 */
router.patch(
  '/:id/estado',
  requireAuth,
  validate(CambiarEstadoPagoSchema),
  PagosController.cambiarEstado
);

export default router;
