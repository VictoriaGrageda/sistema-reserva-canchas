import { Response } from 'express';
import { AuthedRequest } from '../middlewares/auth.middleware';
import { CrearReservaSchema } from '../validations/reservas.schema';
import { ReservasService } from '../services/reservas.service';

export const ReservasController = {
  crear: async (req: AuthedRequest, res: Response) => {
    console.log('[RESERVAS] controller.crear');
    try {
      const parsed = CrearReservaSchema.parse(req.body);
      const usuarioId = req.userId!;
      const r = await ReservasService.crear(usuarioId, parsed.items);
      return res.status(201).json({
        reservaId: r.id,
        estado: 'pendiente',
        total: r.total,
      });
    } catch (err: any) {
      console.error('[RESERVAS] controller.crear ERROR', err);
      if (err.code === 409) return res.status(409).json({ message: err.message });
      if (err.code === 404) return res.status(404).json({ message: err.message });
      return res.status(400).json({ message: err?.message || 'Error al crear la reserva' });
    }
  },

  misReservas: async (req: AuthedRequest, res: Response) => {
    const usuarioId = req.userId!;
    const estado = req.query.estado as any | undefined;
    const data = await ReservasService.misReservas(usuarioId, estado);
    return res.json(data);
  },

  detalle: async (req: AuthedRequest, res: Response) => {
    const usuarioId = req.userId!;
    const data = await ReservasService.detalle(req.params.id, usuarioId);
    if (!data) return res.status(404).json({ message: 'No encontrada' });
    return res.json(data);
  },

  cancelar: async (req: AuthedRequest, res: Response) => {
    try {
      const usuarioId = req.userId!;
      const out = await ReservasService.cancelar(req.params.id, usuarioId);
      return res.json(out);
    } catch (err: any) {
      const code = err.code === 404 ? 404 : 400;
      return res.status(code).json({ message: err.message || 'No se pudo cancelar' });
    }
  },
};
