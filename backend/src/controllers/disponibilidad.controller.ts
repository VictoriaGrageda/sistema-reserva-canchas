import { Request, Response } from 'express';
import { DisponibilidadService } from '../services/disponibilidad.service';

export const DisponibilidadController = {
  async disponibilidadDia(req: Request, res: Response) {
    try {
      const { cancha_id, fecha } = req.params; // fecha: YYYY-MM-DD
      const data = await DisponibilidadService.disponibilidadDia(cancha_id, fecha);
      return res.json(data); // mejor práctica: usar return
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  },
};
