import { Request, Response } from 'express';
import { CanchasService } from '../services/canchas.service';

export const CanchasController = {
  async crear(req: Request, res: Response) {
    try { res.status(201).json(await CanchasService.crear(req.body)); }
    catch (e:any) { res.status(400).json({ message: e.message }); }
  },
  async listarPorComplejo(req: Request, res: Response) {
    res.json(await CanchasService.listarPorComplejo(req.params.complejo_id));
  },
  async actualizar(req: Request, res: Response) {
    res.json(await CanchasService.actualizar(req.params.id, req.body));
  },
  async eliminar(req: Request, res: Response) {
    res.json(await CanchasService.eliminar(req.params.id));
  },
};
