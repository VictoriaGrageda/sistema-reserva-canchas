import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

export const ComplejosRepo = {
  create: (data: any) => prisma.complejos.create({ data }),
  listByAdmin: (admin_id: string) =>
    prisma.complejos.findMany({ where: { admin_id }, orderBy: { nombre: 'asc' } }),
  get: (id: string) => prisma.complejos.findUnique({ where: { id } }),
};
