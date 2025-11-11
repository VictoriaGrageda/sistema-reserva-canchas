// src/repositories/complejos.repo.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type Filtros = {
  ciudad?: string;
  nombre?: string;
};

export const ComplejosRepo = {
  // Crear complejo con canchas incluidas
  createIncludeCanchas: (data: any) =>
    prisma.complejos.create({
      data,
      include: { canchas: true },
    }),

  // Listar complejos filtrados por ciudad y nombre
  list: ({ ciudad, nombre }: Filtros) => {
    // Si hay filtros, buscar con OR (ciudad O nombre)
    // Si no hay filtros, listar todos
    const where: any = ciudad || nombre
      ? {
          OR: [
            ciudad ? { ciudad: { contains: ciudad, mode: 'insensitive' as any } } : undefined,
            nombre ? { nombre: { contains: nombre, mode: 'insensitive' as any } } : undefined,
          ].filter(Boolean),
        }
      : {};

    return prisma.complejos.findMany({
      where,
      include: { canchas: true },
      orderBy: { created_at: 'desc' },
    });
  },

  // Listar complejos por administrador
  listByAdmin: (admin_id: string) =>
    prisma.complejos.findMany({
      where: { admin_id },
      include: { canchas: true },
      orderBy: { nombre: 'desc' },
    }),

  // Obtener un complejo por su id
  getIncludeCanchas: (id: string) =>
    prisma.complejos.findUnique({
      where: { id },
      include: { canchas: true },
    }),


   update: (id: string, data: any) =>
    prisma.complejos.update({
      where: { id },
      data,
      include: { canchas: true }, // para que el front reciba todo
    }),
};


