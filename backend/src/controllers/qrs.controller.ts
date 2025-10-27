import { Request, Response, NextFunction } from 'express';
import { QRsService } from '../services/qrs.service';
import type { AuthedRequest } from '../middlewares/auth.middleware';

export const QRsController = {
  /**
   * POST /api/v1/qrs
   * Subir un nuevo QR (admin)
   */
  async subir(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;
      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Verificar que el usuario sea administrador
      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden subir QRs' });
      }

      const { imagen_qr, vigente } = req.body;

      const qr = await QRsService.subirQR(admin_id, imagen_qr, vigente);

      return res.status(201).json({
        message: 'QR subido exitosamente',
        data: qr,
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/qrs/mis-qrs
   * Listar QRs del administrador autenticado
   */
  async misQRs(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;
      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden ver sus QRs' });
      }

      const qrs = await QRsService.listarMisQRs(admin_id);

      return res.json({ data: qrs });
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/qrs/vigente
   * Obtener el QR vigente del administrador autenticado
   */
  async obtenerVigente(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const admin_id = req.user?.id;
      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden acceder' });
      }

      const qr = await QRsService.obtenerQRVigente(admin_id);

      return res.json({ data: qr });
    } catch (error: any) {
      return res.status(error.status || 404).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/qrs/complejo/:complejo_id
   * Obtener el QR vigente de un complejo (para clientes al hacer reserva)
   */
  async obtenerPorComplejo(req: Request, res: Response, next: NextFunction) {
    try {
      const { complejo_id } = req.params;

      if (!complejo_id) {
        return res.status(400).json({ message: 'ID de complejo requerido' });
      }

      const qr = await QRsService.obtenerQRPorComplejo(complejo_id);

      return res.json({ data: qr });
    } catch (error: any) {
      return res.status(error.status || 404).json({ message: error.message });
    }
  },

  /**
   * GET /api/v1/qrs/:id
   * Obtener un QR por ID
   */
  async obtenerPorId(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!id) {
        return res.status(400).json({ message: 'ID de QR requerido' });
      }

      const qr = await QRsService.obtenerQRPorId(id, admin_id);

      return res.json({ data: qr });
    } catch (error: any) {
      return res.status(error.status || 404).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/qrs/:id/activar
   * Marcar un QR como vigente (admin)
   */
  async activar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden activar QRs' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de QR requerido' });
      }

      const qr = await QRsService.activarQR(id, admin_id);

      return res.json({
        message: 'QR activado exitosamente',
        data: qr,
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * PATCH /api/v1/qrs/:id/desactivar
   * Desactivar un QR (admin)
   */
  async desactivar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden desactivar QRs' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de QR requerido' });
      }

      const qr = await QRsService.desactivarQR(id, admin_id);

      return res.json({
        message: 'QR desactivado exitosamente',
        data: qr,
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },

  /**
   * DELETE /api/v1/qrs/:id
   * Eliminar un QR (solo si no tiene pagos asociados)
   */
  async eliminar(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const admin_id = req.user?.id;

      if (!admin_id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (req.user?.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden eliminar QRs' });
      }

      if (!id) {
        return res.status(400).json({ message: 'ID de QR requerido' });
      }

      await QRsService.eliminarQR(id, admin_id);

      return res.json({
        message: 'QR eliminado exitosamente',
      });
    } catch (error: any) {
      return res.status(error.status || 400).json({ message: error.message });
    }
  },
};
