import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

export const HorariosRepo = {
  create: (data: any) => prisma.horarios.create({ data }),
  // Solapamiento: start < existing.end && end > existing.start
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
};
