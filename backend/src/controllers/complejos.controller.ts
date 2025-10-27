import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma';
import { ComplejosService } from '../services/complejos.service';
import { serializeComplejo } from '../utils/serialize';

export const ComplejosController = {
  /** ===================== CREAR COMPLEJO ===================== */
  async crear(req: Request, res: Response) {
    try {
      const d = req.body;

      //  Validaciones mínimas (básicas)
      if (!d.nombre || !d.otb || !d.subalcaldia || !d.celular) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }
      if (!Array.isArray(d.diasDisponibles) || d.diasDisponibles.length === 0) {
        return res.status(400).json({ message: 'diasDisponibles debe tener al menos 1 día' });
      }

      // 🏟️ Si vienen canchas desde el front, mapear para crear anidadamente
      let canchasCreate: any = undefined;
      if (Array.isArray(d.canchas) && d.canchas.length) {
        canchasCreate = {
          create: d.canchas.map((c: any) => ({
            nombre: c.nombre,
            tipoCancha: c.tipoCancha, // 'FUT5' | 'FUT7' | ...
            precioDiurnoPorHora:
              c.precioDiurnoPorHora != null ? new Prisma.Decimal(c.precioDiurnoPorHora) : null,
            precioNocturnoPorHora:
              c.precioNocturnoPorHora != null ? new Prisma.Decimal(c.precioNocturnoPorHora) : null,
          })),
        };
      }

      //  Construir objeto para Prisma
      const data = {
        nombre: d.nombre,
        otb: d.otb,
        subalcaldia: d.subalcaldia,
        celular: d.celular,
        telefono: d.telefono ?? null,
        diasDisponibles: d.diasDisponibles,
        precioDiurnoPorHora: new Prisma.Decimal(d.precioDiurnoPorHora),
        precioNocturnoPorHora: new Prisma.Decimal(d.precioNocturnoPorHora),
        direccion: d.direccion ?? null,
        ciudad: d.ciudad ?? null,
        lat: d.lat != null ? new Prisma.Decimal(d.lat) : null,
        lng: d.lng != null ? new Prisma.Decimal(d.lng) : null,
        observaciones: d.observaciones ?? null,
        qrUrl: d.qrUrl ?? null,
        logotipo: d.logotipo ?? null,
        admin_id: d.admin_id,
        canchas: canchasCreate,
      };

      //  Crear complejo
      const creado = await ComplejosService.crear(data);
      return res.status(201).json(serializeComplejo(creado));

    } catch (e: any) {
      //  Error de unicidad: (nombre + ciudad)
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return res.status(409).json({
          message: 'Ya existe un complejo con ese nombre en esa ciudad'
        });
      }
      console.error(e);
      res.status(400).json({ message: e.message });
    }
  },

  /** ===================== LISTAR TODOS ===================== */
  async listar(req: Request, res: Response) {
    const { ciudad, nombre } = req.query as { ciudad?: string; nombre?: string };
    const data = await ComplejosService.listar(ciudad, nombre);
    return res.json(data.map(serializeComplejo));
  },

  /** ===================== LISTAR POR ADMIN ===================== */
  async listarPorAdmin(req: Request, res: Response) {
    const { admin_id } = req.params;
    const data = await ComplejosService.listarPorAdmin(admin_id);
    return res.json(data.map(serializeComplejo));
  },

  /** ===================== OBTENER UNO ===================== */
  async obtener(req: Request, res: Response) {
    const data = await ComplejosService.obtener(req.params.id);
    if (!data) return res.status(404).json({ message: 'No encontrado' });
    return res.json(serializeComplejo(data));
  },


  async actualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const d = req.body ?? {};

      // Normalizaciones y validaciones suaves
      if (typeof d.nombre === 'string') d.nombre = d.nombre.trim();
      if (typeof d.ciudad === 'string') d.ciudad = d.ciudad.trim();

      if ('diasDisponibles' in d) {
        if (!Array.isArray(d.diasDisponibles) || d.diasDisponibles.length === 0) {
          return res.status(400).json({ message: 'diasDisponibles no puede estar vacío' });
        }
      }

      // Construimos "data" solo con campos presentes (PATCH parcial)
      const data: any = {};
      if (d.nombre != null) data.nombre = d.nombre;
      if (d.otb != null) data.otb = d.otb;
      if (d.subalcaldia != null) data.subalcaldia = d.subalcaldia;
      if (d.celular != null) data.celular = d.celular;
      if (d.telefono !== undefined) data.telefono = d.telefono ?? null;

      if (d.diasDisponibles != null) data.diasDisponibles = d.diasDisponibles;

      if (d.precioDiurnoPorHora != null) {
        data.precioDiurnoPorHora = new Prisma.Decimal(d.precioDiurnoPorHora);
      }
      if (d.precioNocturnoPorHora != null) {
        data.precioNocturnoPorHora = new Prisma.Decimal(d.precioNocturnoPorHora);
      }

      if (d.direccion !== undefined) data.direccion = d.direccion ?? null;
      if (d.ciudad !== undefined) data.ciudad = d.ciudad ?? null;

      if (d.lat !== undefined) {
        data.lat = d.lat == null ? null : new Prisma.Decimal(d.lat);
      }
      if (d.lng !== undefined) {
        data.lng = d.lng == null ? null : new Prisma.Decimal(d.lng);
      }

      if (d.observaciones !== undefined) data.observaciones = d.observaciones ?? null;
      if (d.qrUrl !== undefined) data.qrUrl = d.qrUrl ?? null;
      if (d.logotipo !== undefined) data.logotipo = d.logotipo ?? null;

      const actualizado = await ComplejosService.actualizar(id, data);
      if (!actualizado) return res.status(404).json({ message: 'No encontrado' });

      return res.json(serializeComplejo(actualizado));
    } catch (e: any) {
      // Conflicto por unique (nombre, ciudad)
      if (e?.code === 'P2002') {
        return res.status(409).json({ message: 'Ya existe un complejo con ese nombre en esa ciudad' });
      }
      // No encontrado (update que no matchea)
      if (e?.code === 'P2025') {
        return res.status(404).json({ message: 'No encontrado' });
      }
      console.error('Actualizar complejo error:', e);
      return res.status(400).json({ message: e.message ?? 'Error al actualizar complejo' });
    }
  },
};


