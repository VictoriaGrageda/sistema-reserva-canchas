import { Request, Response, NextFunction } from 'express';
import { ReservasService } from '../services/reservas.service';
import type { AuthedRequest } from '../middlewares/auth.middleware';

/**
 * Serializar Decimal a number para JSON
 */
const serializeReserva = (reserva: any) => {
  if (!reserva) return null;

  return {
    ...reserva,
    items: reserva.items?.map((item: any) => ({
      ...item,
      precio: item.precio ? Number(item.precio) : null,
    })),
  };
};

export const ReservasController = {
  /**
   * POST /api/v1/reservas
   * Crear una nueva reserva (cliente autenticado)
   */
  async crear(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const reserva = await ReservasService.crear(usuario_id, req.body);
      return res.status(201).json({ data: serializeReserva(reserva) });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/reservas/mis-reservas
   * Obtener historial de reservas del usuario autenticado
   * Query params: ?estado=pendiente&limit=20&offset=0
   */
  async misReservas(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { estado, limit, offset } = req.query;

      const reservas = await ReservasService.misReservas(usuario_id, {
        estado: estado as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      return res.json({ data: reservas.map(serializeReserva) });
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/reservas/:id
   * Obtener detalle de una reserva específica
   */
  async obtenerDetalle(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { id } = req.params;
      const reserva = await ReservasService.obtenerDetalle(id, usuario_id);

      return res.json({ data: serializeReserva(reserva) });
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/reservas/:id
   * Modificar una reserva (cambiar horarios)
   */
  async modificar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { id } = req.params;
      const reserva = await ReservasService.modificar(id, usuario_id, req.body);

      return res.json({ data: serializeReserva(reserva) });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * DELETE /api/v1/reservas/:id
   * Cancelar una reserva
   */
  async cancelar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { id } = req.params;
      const reserva = await ReservasService.cancelar(id, usuario_id);

      return res.json({
        message: 'Reserva cancelada exitosamente',
        data: serializeReserva(reserva)
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/reservas/admin/panel
   * Panel de administrador - ver reservas de sus complejos
   * Query params: ?complejo_id=uuid&estado=pendiente&fecha=2024-10-20
   */
  async panelAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;
      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Verificar que sea administrador
      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Acceso denegado. Solo administradores' });
      }

      const { complejo_id, estado, fecha } = req.query;

      const reservas = await ReservasService.listarPorAdmin(admin_id, {
        complejo_id: complejo_id as string,
        estado: estado as string,
        fecha: fecha as string,
      });

      return res.json({ data: reservas.map(serializeReserva) });
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/reservas/:id/estado
   * Cambiar estado de una reserva (admin)
   * Body: { estado: "confirmada" | "cancelada" }
   */
  async cambiarEstado(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;
      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Verificar que sea administrador
      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Acceso denegado. Solo administradores' });
      }

      const { id } = req.params;
      const { estado } = req.body;

      const reserva = await ReservasService.cambiarEstado(id, admin_id, estado);

      return res.json({
        message: `Reserva ${estado} exitosamente`,
        data: serializeReserva(reserva)
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * 🆕 POST /api/v1/reservas/mensual
   * Crear una reserva mensual
   */
  async crearMensual(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const reserva = await ReservasService.crearMensual(usuario_id, req.body);
      return res.status(201).json({ data: serializeReserva(reserva) });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * POST /api/v1/reservas/mensual/preview
   * Previsualizar slots y total para una reserva mensual
   */
  async previewMensual(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      // No requiere datos del usuario, solo parámetros
      const preview = await ReservasService.previewMensual(req.body);
      return res.json({ data: preview });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * 🆕 POST /api/v1/reservas/recurrente
   * Crear una reserva recurrente
   */
  async crearRecurrente(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const reserva = await ReservasService.crearRecurrente(usuario_id, req.body);
      return res.status(201).json({ data: serializeReserva(reserva) });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },
};
