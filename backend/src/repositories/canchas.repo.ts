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
      where: { activo: true, complejo: { admin_id: adminId } }, // <- admin_id según tu schema
      select: {
        id: true,
        nombre: true,
        tipoCancha: true,   // <- existe en tu schema
        // superficie no existe en tu schema; si luego lo agregas, ponlo aquí
        complejo: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    }),

  // ✅ DETALLE DE CANCHA (incluye precios de cancha y del complejo)
  findDetalle: (id: string) =>
    prisma.canchas.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        tipoCancha: true,
        precioDiurnoPorHora: true,
        precioNocturnoPorHora: true,
        complejo: {
          select: {
            id: true,
            nombre: true,
            precioDiurnoPorHora: true,
            precioNocturnoPorHora: true,
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
