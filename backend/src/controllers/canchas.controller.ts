import { Request, Response } from 'express';
import { CanchasService } from '../services/canchas.service';
import { Prisma } from '../generated/prisma';

export const CanchasController = {
  async crear(req: Request, res: Response) {
    try { res.status(201).json(await CanchasService.crear(req.body)); }
    catch (e:any) { res.status(400).json({ message: e.message }); }
  },
  async listarPorComplejo(req: Request, res: Response) {
    res.json(await CanchasService.listarPorComplejo(req.params.complejo_id));
  },
  async eliminar(req: Request, res: Response) {
    res.json(await CanchasService.eliminar(req.params.id));
  },
  async actualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const d = req.body ?? {};

      // Validaciones suaves
      if (typeof d.nombre === 'string') d.nombre = d.nombre.trim();

      // Si viene precio, mapeamos a Decimal. Si no viene, no tocamos.
      const data: any = {};
      if (d.nombre != null) data.nombre = d.nombre;
      if (d.tipoCancha != null) data.tipoCancha = d.tipoCancha; // debe ser del enum
      if (d.activo != null) data.activo = !!d.activo;

      if (d.precioDiurnoPorHora != null) {
        data.precioDiurnoPorHora = new Prisma.Decimal(d.precioDiurnoPorHora);
      }
      if (d.precioNocturnoPorHora != null) {
        data.precioNocturnoPorHora = new Prisma.Decimal(d.precioNocturnoPorHora);
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' });
      }

      const cancha = await CanchasService.actualizar(id, data);
      if (!cancha) return res.status(404).json({ message: 'No encontrada' });

      // Serializar Decimals -> number para la respuesta
      return res.json({
        ...cancha,
        precioDiurnoPorHora:
          cancha.precioDiurnoPorHora == null ? null : Number(cancha.precioDiurnoPorHora),
        precioNocturnoPorHora:
          cancha.precioNocturnoPorHora == null ? null : Number(cancha.precioNocturnoPorHora),
      });
    } catch (e: any) {
      if (e?.code === 'P2025') return res.status(404).json({ message: 'No encontrada' });
      console.error('Actualizar cancha error:', e);
      return res.status(400).json({ message: e.message ?? 'Error al actualizar cancha' });
    }
  },
};
