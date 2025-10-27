import { Router } from 'express';
import { QRsController } from '../controllers/qrs.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { SubirQRSchema } from '../validations/qrs.schema';

const router = Router();

// ==================== Rutas de Administrador ====================

/**
 * POST /api/v1/qrs
 * Subir un nuevo QR
 * Requiere rol: administrador
 * Body: { imagen_qr: string (URL o base64), vigente?: boolean }
 */
router.post(
  '/',
  requireAuth,
  validate(SubirQRSchema),
  QRsController.subir
);

/**
 * GET /api/v1/qrs/mis-qrs
 * Listar todos los QRs del administrador autenticado
 * Requiere rol: administrador
 */
router.get(
  '/mis-qrs',
  requireAuth,
  QRsController.misQRs
);

/**
 * GET /api/v1/qrs/vigente
 * Obtener el QR vigente del administrador autenticado
 * Requiere rol: administrador
 */
router.get(
  '/vigente',
  requireAuth,
  QRsController.obtenerVigente
);

/**
 * GET /api/v1/qrs/complejo/:complejo_id
 * Obtener el QR vigente de un complejo (para clientes)
 * No requiere autenticación
 */
router.get(
  '/complejo/:complejo_id',
  QRsController.obtenerPorComplejo
);

/**
 * GET /api/v1/qrs/:id
 * Obtener un QR específico por ID
 * Requiere autenticación
 */
router.get(
  '/:id',
  requireAuth,
  QRsController.obtenerPorId
);

/**
 * PATCH /api/v1/qrs/:id/activar
 * Marcar un QR como vigente (y los demás como no vigentes)
 * Requiere rol: administrador
 */
router.patch(
  '/:id/activar',
  requireAuth,
  QRsController.activar
);

/**
 * PATCH /api/v1/qrs/:id/desactivar
 * Desactivar un QR
 * Requiere rol: administrador
 */
router.patch(
  '/:id/desactivar',
  requireAuth,
  QRsController.desactivar
);

/**
 * DELETE /api/v1/qrs/:id
 * Eliminar un QR (solo si no tiene pagos asociados)
 * Requiere rol: administrador
 */
router.delete(
  '/:id',
  requireAuth,
  QRsController.eliminar
);

export default router;
