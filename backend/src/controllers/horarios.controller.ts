import { Request, Response } from 'express';
import { HorariosService } from '../services/horarios.service';

export const HorariosController = {
  async crear(req: Request, res: Response) {
    try {
      const data = await HorariosService.crear(req.body);
      res.status(201).json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },

  async listar(req: Request, res: Response) {
    const { cancha_id, fecha } = req.params; // fecha: YYYY-MM-DD
    const data = await HorariosService.listar(cancha_id, fecha);
    res.json(data);
  },

  async eliminar(req: Request, res: Response) {
    const data = await HorariosService.eliminar(req.params.id);
    res.json(data);
  },
};
