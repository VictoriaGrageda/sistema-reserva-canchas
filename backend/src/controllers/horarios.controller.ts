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
  async crearBulk(req: Request, res: Response) {
    try {
      const created = await HorariosService.crearBulk(req.body);
      return res.status(201).json({ created });
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
},
  async editar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await HorariosService.editar(id, req.body);
      return res.json(updated);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  },
}