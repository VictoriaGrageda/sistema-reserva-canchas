// src/repositories/horarios.repo.ts
import { prisma } from '../config/prisma';

type SlotInput = {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible?: boolean;
  precio?: number;
  es_diurno?: boolean;
};

export const HorariosRepo = {
  create: (data: any) => prisma.horarios.create({ data }),

  findOverlap: (cancha_id: string, fecha: Date, ini: Date, fin: Date) =>
    prisma.horarios.findFirst({
      where: { cancha_id, fecha, AND: [{ hora_inicio: { lt: fin } }, { hora_fin: { gt: ini } }] },
    }),

  listByCanchaFecha: (cancha_id: string, fecha: Date) =>
    prisma.horarios.findMany({
      where: { cancha_id, fecha, disponible: true },
      orderBy: { hora_inicio: 'asc' },
    }),

  remove: (id: string) => prisma.horarios.delete({ where: { id } }),

  // 🔧 NUEVO createMany SIN $transaction
  createMany: async ({ cancha_id, slots }: { cancha_id: string; slots: SlotInput[] }) => {
    const createdIds: string[] = [];

    for (const s of slots) {
      const fecha = new Date(s.fecha);
      const hora_inicio = new Date(`1970-01-01T${s.hora_inicio}Z`);
      const hora_fin = new Date(`1970-01-01T${s.hora_fin}Z`);

      // Revisar solape contra lo que ya hay en BD
      const overlap = await prisma.horarios.findFirst({
        where: {
          cancha_id,
          fecha,
          AND: [{ hora_inicio: { lt: hora_fin } }, { hora_fin: { gt: hora_inicio } }],
        },
      });

      if (overlap) {
        throw new Error(`Solapamiento en ${s.fecha} ${s.hora_inicio}-${s.hora_fin}`);
      }

      const h = await prisma.horarios.create({
        data: {
          cancha_id,
          fecha,
          hora_inicio,
          hora_fin,
          disponible: s.disponible ?? true,
          precio: s.precio,
          es_diurno: s.es_diurno ?? true,
        },
      });

      createdIds.push(h.id);
    }

    return createdIds;
  },

  updateOne: async (id: string, body: any) => {
    const data: any = {};
    if (body.disponible !== undefined) data.disponible = !!body.disponible;
    if (body.hora_inicio) data.hora_inicio = new Date(`1970-01-01T${body.hora_inicio}Z`);
    if (body.hora_fin) data.hora_fin = new Date(`1970-01-01T${body.hora_fin}Z`);
    return prisma.horarios.update({ where: { id }, data });
  },
};
