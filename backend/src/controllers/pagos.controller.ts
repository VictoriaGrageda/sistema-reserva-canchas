import { Request, Response, NextFunction } from 'express';
import { PagosService } from '../services/pagos.service';
import type { AuthedRequest } from '../middlewares/auth.middleware';

/**
 * Serializar Decimal a number para JSON
 */
const serializePago = (pago: any) => {
  if (!pago) return null;

  return {
    ...pago,
    reserva: pago.reserva
      ? {
          ...pago.reserva,
          items: pago.reserva.items?.map((item: any) => ({
            ...item,
            precio: item.precio ? Number(item.precio) : null,
          })),
        }
      : null,
  };
};

/**
 * Verificar rol de administrador (siempre consulta BD para asegurar rol actualizado)
 */
const verificarRolAdmin = async (req: AuthedRequest): Promise<boolean> => {
  if (!req.user?.id) {
    return false;
  }

  // Siempre consultar la BD para obtener el rol actualizado
  const { PrismaClient } = await import('../generated/prisma');
  const prisma = new PrismaClient();

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.user.id },
      select: { rol: true }
    });

    return usuario?.rol === 'administrador';
  } finally {
    await prisma.$disconnect();
  }
};

export const PagosController = {
  /**
   * GET /api/v1/pagos/reserva/:reserva_id
   * Obtener el pago de una reserva (cliente)
   */
  async obtenerPorReserva(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { reserva_id } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (!reserva_id) {
        return res.status(400).json({ message: 'ID de reserva requerido' });
      }

      const pago = await PagosService.obtenerPagoDeReserva(reserva_id, usuario_id);

      return res.json({ data: serializePago(pago) });
    } catch (error: any) {
      return res.status(error.status || 404).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/pagos/reserva/:reserva_id/qr
   * Obtener QR para pagar una reserva (cliente)
   */
  async obtenerQRParaPago(req: Request, res: Response, next: NextFunction) {
    try {
      const { reserva_id } = req.params;

      if (!reserva_id) {
        return res.status(400).json({ message: 'ID de reserva requerido' });
      }

      const result = await PagosService.obtenerQRParaPago(reserva_id);

      // Calcular el monto total de la reserva
      const montoTotal = result.pago.reserva.items.reduce((sum: number, item: any) => {
        return sum + Number(item.precio || 0);
      }, 0);

      return res.json({
        data: {
          pago: serializePago(result.pago),
          qr: result.qr ? {
            ...result.qr,
            monto: montoTotal,
          } : null,
        },
      });
    } catch (error: any) {
      return res.status(error.status || 404).json({ message: error.message });
    }
  },

  /**
   * POST /api/v1/pagos/reserva/:reserva_id/marcar-realizado
   * Cliente marca que realizó el pago
   */
  async marcarRealizado(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { reserva_id } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (!reserva_id) {
        return res.status(400).json({ message: 'ID de reserva requerido' });
      }

      const { comprobante, qr_id } = req.body;

      const pago = await PagosService.marcarPagoRealizado(reserva_id, usuario_id, comprobante, qr_id);

      return res.json({
        message: 'Pago marcado como realizado. Espera la confirmación del administrador.',
        data: serializePago(pago),
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/pagos/admin
   * Listar pagos del administrador con filtros
   * Query params: ?estado=pendiente&complejo_id=uuid
   */
  async listarPorAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Verificar rol de administrador
      const esAdmin = await verificarRolAdmin(req);
      if (!esAdmin) {
        return res.status(403).json({
          message: 'Solo los administradores pueden acceder',
          hint: 'Si recibes este error, intenta cerrar sesión y volver a iniciar sesión para actualizar tu token.'
        });
      }

      const { estado, complejo_id } = req.query;

      const pagos = await PagosService.listarPagosPorAdmin(admin_id, {
        estado: estado as string,
        complejo_id: complejo_id as string,
      });

      return res.json({ data: pagos.map(serializePago) });
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/pagos/admin/pendientes
   * Listar pagos pendientes del administrador
   */
  async listarPendientes(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Verificar rol de administrador
      const esAdmin = await verificarRolAdmin(req);
      if (!esAdmin) {
        return res.status(403).json({ message: 'Solo los administradores pueden acceder' });
      }

      const pagos = await PagosService.listarPagosPendientes(admin_id);

      return res.json({ data: pagos.map(serializePago) });
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/pagos/:id
   * Obtener detalle de un pago (admin)
   */
  async obtenerPorId(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const esAdmin = await verificarRolAdmin(req);
      if (!esAdmin) {
        return res.status(403).json({ message: 'Solo los administradores pueden acceder' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de pago requerido' });
      }

      const pago = await PagosService.obtenerDetallePago(id, admin_id);

      return res.json({ data: serializePago(pago) });
    } catch (error: any) {
      return res.status(error.status || 404).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/pagos/:id/confirmar
   * Administrador confirma el pago
   */
  async confirmar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const esAdmin = await verificarRolAdmin(req);
      if (!esAdmin) {
        return res.status(403).json({ message: 'Solo los administradores pueden confirmar pagos' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de pago requerido' });
      }

      const pago = await PagosService.confirmarPago(id, admin_id);

      return res.json({
        message: 'Pago confirmado. La reserva ha sido confirmada.',
        data: serializePago(pago),
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/pagos/:id/rechazar
   * Administrador rechaza el pago
   */
  async rechazar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const esAdmin = await verificarRolAdmin(req);
      if (!esAdmin) {
        return res.status(403).json({ message: 'Solo los administradores pueden rechazar pagos' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de pago requerido' });
      }

      const pago = await PagosService.rechazarPago(id, admin_id);

      return res.json({
        message: 'Pago rechazado. La reserva ha sido cancelada y los horarios liberados.',
        data: serializePago(pago),
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/pagos/:id/estado
   * Cambiar estado del pago (admin) - método genérico
   */
  async cambiarEstado(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;
      const { estado } = req.body;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const esAdmin = await verificarRolAdmin(req);
      if (!esAdmin) {
        return res.status(403).json({ message: 'Solo los administradores pueden cambiar estado de pagos' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de pago requerido' });
      }

      if (!estado || !['confirmado', 'rechazado'].includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido. Debe ser "confirmado" o "rechazado"' });
      }

      const pago = await PagosService.cambiarEstadoPago(id, estado, admin_id);

      return res.json({
        message: `Pago ${estado === 'confirmado' ? 'confirmado' : 'rechazado'} exitosamente`,
        data: serializePago(pago),
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },
};
