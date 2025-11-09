import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

type SlotInput = {
  fecha: string;          // "YYYY-MM-DD"
  hora_inicio: string;    // "08:00:00"
  hora_fin: string;       // "09:00:00"
  disponible?: boolean;
  precio?: number;        // Precio del slot
  es_diurno?: boolean;    // true = diurno, false = nocturno
};

export const HorariosRepo = {
  /** Crear un solo slot (tu método existente) */
  create: (data: any) => prisma.horarios.create({ data }),

  /** Buscar solapamiento (tu método existente) 
   *  Regla: start < existing.end && end > existing.start
   */
  findOverlap: (cancha_id: string, fecha: Date, ini: Date, fin: Date) =>
    prisma.horarios.findFirst({
      where: { cancha_id, fecha, AND: [{ hora_inicio: { lt: fin } }, { hora_fin: { gt: ini } }] },
    }),

  /** Listar slots disponibles por cancha/fecha (tu método existente) */
  listByCanchaFecha: (cancha_id: string, fecha: Date) =>
    prisma.horarios.findMany({
      where: { cancha_id, fecha, disponible: true },
      orderBy: { hora_inicio: 'asc' },
    }),

  /** Eliminar slot por id (tu método existente) */
  remove: (id: string) => prisma.horarios.delete({ where: { id } }),

  /** ✅ NUEVO: crear varios slots en una sola transacción (bulk) 
   * - Valida solapes para cada slot
   * - Si encuentra solape, aborta toda la transacción (no crea nada a medias)
   * - Devuelve array de IDs creados
   */
  createMany: async ({ cancha_id, slots }: { cancha_id: string; slots: SlotInput[] }) => {
    return prisma.$transaction(async (tx) => {
      const createdIds: string[] = [];
      for (const s of slots) {
        const fecha = new Date(s.fecha);
        const hora_inicio = new Date(`1970-01-01T${s.hora_inicio}Z`);
        const hora_fin = new Date(`1970-01-01T${s.hora_fin}Z`);

        // Verificar solape contra lo ya existente (en la misma fecha/cancha)
        const overlap = await tx.horarios.findFirst({
          where: {
            cancha_id,
            fecha,
            AND: [{ hora_inicio: { lt: hora_fin } }, { hora_fin: { gt: hora_inicio } }],
          },
        });
        if (overlap) {
          throw new Error(`Solapamiento en ${s.fecha} ${s.hora_inicio}-${s.hora_fin}`);
        }

        const h = await tx.horarios.create({
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
    });
  },

  /** (Opcional) Actualizar un slot puntual */
  updateOne: async (id: string, body: any) => {
    const data: any = {};
    if (body.disponible !== undefined) data.disponible = !!body.disponible;
    if (body.hora_inicio) data.hora_inicio = new Date(`1970-01-01T${body.hora_inicio}Z`);
    if (body.hora_fin)    data.hora_fin    = new Date(`1970-01-01T${body.hora_fin}Z`);
    return prisma.horarios.update({ where: { id }, data });
  },
};
