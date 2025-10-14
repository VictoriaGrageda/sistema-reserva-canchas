import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

export const CanchasRepo = {
  create: (data: any) => prisma.canchas.create({ data }),
  listByComplejo: (complejo_id: string) =>
    prisma.canchas.findMany({ where: { complejo_id, activo: true }, orderBy: { nombre: 'asc' } }),
  update: (id: string, data: any) => prisma.canchas.update({ where: { id }, data }),
  softDelete: (id: string) => prisma.canchas.update({ where: { id }, data: { activo: false } }),
};
