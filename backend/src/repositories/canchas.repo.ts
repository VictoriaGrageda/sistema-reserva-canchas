import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

const toNum = (v: any): number | null => (v == null ? null : Number(v));

export const CanchasRepo = {
  create: (data: any) => prisma.canchas.create({ data }),

  listByComplejo: (complejo_id: string) =>
    prisma.canchas.findMany({ where: { complejo_id } }),

  update: (id: string, data: any) =>
    prisma.canchas.update({ where: { id }, data }),

  softDelete: (id: string) =>
    prisma.canchas.update({
      where: { id },
      data: { activo: false },
    }),

  // ✅ MIS CANCHAS (admin actual → complejos.admin_id)
  listMine: (adminId: string) =>
  prisma.canchas.findMany({
    where: {
      activo: true,
      OR: [
        { admin_id: adminId },               // canchas individuales del admin
        { complejo: { admin_id: adminId } }, // canchas de sus complejos
      ],
    },
    select: {
      id: true,
      nombre: true,
      tipoCancha: true,
      tipoCampo: true,  // 👈 este nombre ya coincide con schema
      complejo: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  }),

  // ✅ DETALLE DE CANCHA (incluye precios de cancha y del complejo)
  // ✅ DETALLE DE CANCHA (incluye admin y admin del complejo)
findDetalle: (id: string) =>
  prisma.canchas.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      tipoCancha: true,
      tipoCampo: true,
      precioDiurnoPorHora: true,
      precioNocturnoPorHora: true,
      admin: { // dueño de canchas individuales
        select: { id: true, nombre: true, correo: true },
      },
      complejo: {
        select: {
          id: true,
          nombre: true,
          precioDiurnoPorHora: true,
          precioNocturnoPorHora: true,
          admin: { // administrador del complejo
            select: { id: true, nombre: true, correo: true },
          },
        },
      },
    },
  }),


  // (ya lo tenías) precios con fallback
  async getPrecios(canchaId: string) {
    const cancha = await prisma.canchas.findUnique({
      where: { id: canchaId },
      select: {
        precioDiurnoPorHora: true,
        precioNocturnoPorHora: true,
        complejo: {
          select: {
            precioDiurnoPorHora: true,
            precioNocturnoPorHora: true,
          },
        },
      },
    });

    if (!cancha) return null;

    return {
      cancha: {
        precioDiurnoPorHora: toNum(cancha.precioDiurnoPorHora),
        precioNocturnoPorHora: toNum(cancha.precioNocturnoPorHora),
      },
      complejo: {
        precioDiurnoPorHora: toNum(cancha.complejo?.precioDiurnoPorHora),
        precioNocturnoPorHora: toNum(cancha.complejo?.precioNocturnoPorHora),
      },
    };
  },
};
