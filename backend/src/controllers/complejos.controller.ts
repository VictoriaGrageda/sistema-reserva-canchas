import { Request, Response } from 'express';
import { ComplejosService } from '../services/complejos.service';

export const ComplejosController = {
  async crear(req: Request, res: Response) {
    try {
      const data = await ComplejosService.crear(req.body);
      res.status(201).json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },

  async listarPorAdmin(req: Request, res: Response) {
    const { admin_id } = req.params;
    const data = await ComplejosService.listarPorAdmin(admin_id);
    res.json(data);
    },

  async obtener(req: Request, res: Response) {
    const data = await ComplejosService.obtener(req.params.id);
    if (!data) return res.status(404).json({ message: 'No encontrado' });
    res.json(data);
  },
};
