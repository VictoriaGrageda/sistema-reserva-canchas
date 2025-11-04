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


  // ✅ LISTAR CANCHAS INDIVIDUALES (sin complejo, solo con admin_id)
  listIndividuales: (filtros?: { ciudad?: string; nombre?: string }) => {
    const where: any = {
      activo: true,
      admin_id: { not: null }, // tiene admin_id
      complejo_id: null,       // NO tiene complejo
    };

    // Filtros opcionales
    if (filtros?.ciudad || filtros?.nombre) {
      where.OR = [
        filtros.ciudad ? { ciudad: { contains: filtros.ciudad, mode: 'insensitive' } } : undefined,
        filtros.nombre ? { nombre: { contains: filtros.nombre, mode: 'insensitive' } } : undefined,
      ].filter(Boolean);
    }

    return prisma.canchas.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        tipoCancha: true,
        tipoCampo: true,
        ciudad: true,
        direccion: true,
        precioDiurnoPorHora: true,
        precioNocturnoPorHora: true,
        admin: {
          select: { id: true, nombre: true, correo: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  },

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
