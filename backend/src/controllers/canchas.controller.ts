import { Request, Response } from 'express';
import { CanchasService } from '../services/canchas.service';
import { Prisma } from '../generated/prisma';

export const CanchasController = {
  async crear(req: Request, res: Response) {
    try {
      // ✅ obtenemos el admin desde el token o query (?adminId=)
      const adminId =
        (req as any).user?.sub || (req as any).user?.id || (req.query.adminId as string);

      if (!adminId) {
        return res.status(401).json({ message: 'adminId no encontrado (token o query ?adminId=)' });
      }

      // ✅ si no se envía complejo_id, la cancha es individual → se asigna admin_id
      const data = {
        ...req.body,
        complejo_id: req.body.complejo_id ?? null,
        admin_id: req.body.complejo_id ? null : adminId,
      };

      const cancha = await CanchasService.crear(data);
      return res.status(201).json(cancha);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
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
   //GET /api/v1/canchas/mias
  async misCanchas(req: Request, res: Response) {
    try {
      const adminId =
        (req as any).user?.sub || (req as any).user?.id || (req.query.adminId as string);
      if (!adminId) throw new Error('adminId no encontrado (token o query ?adminId=)');
      const data = await CanchasService.misCanchas(adminId);
      return res.json(
        data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          tipoCancha: c.tipoCancha, // <- tal cual tu schema
          complejo: c.complejo,
        }))
      );
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  },

  // GET /api/v1/canchas/:id/detalle
  async detalle(req: Request, res: Response) {
  try {
    const cancha: any = await CanchasService.detalle(req.params.id);
    if (!cancha) return res.status(404).json({ message: 'Cancha no encontrada' });

    return res.json({
      id: cancha.id,
      nombre: cancha.nombre,
      tipoCancha: cancha.tipoCancha,
      tipoCampo: cancha.tipoCampo,
      complejo: cancha.complejo
        ? {
            id: cancha.complejo.id,
            nombre: cancha.complejo.nombre,
            admin: cancha.complejo.admin
              ? {
                  id: cancha.complejo.admin.id,
                  nombre: cancha.complejo.admin.nombre,
                  correo: cancha.complejo.admin.correo,
                }
              : null,
          }
        : null,
      admin: cancha.admin
        ? {
            id: cancha.admin.id,
            nombre: cancha.admin.nombre,
            correo: cancha.admin.correo,
          }
        : null,
      precios: {
        diurno:
          cancha.precioDiurnoPorHora ??
          cancha.complejo?.precioDiurnoPorHora ??
          null,
        nocturno:
          cancha.precioNocturnoPorHora ??
          cancha.complejo?.precioNocturnoPorHora ??
          null,
      },
    });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
},

};
