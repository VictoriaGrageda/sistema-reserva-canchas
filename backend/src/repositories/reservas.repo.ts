import { prisma } from '../config/prisma';

export const ReservasRepo = {
  async findHorarioExacto(canchaId: string, fechaISO: string, inicioHHMM: string, finHHMM: string) {
    const fecha = new Date(fechaISO + 'T00:00:00.000Z');
    const hIni = new Date(`1970-01-01T${inicioHHMM}:00.000Z`);
    const hFin = new Date(`1970-01-01T${finHHMM}:00.000Z`);

    return prisma.horarios.findFirst({
      where: {
        cancha_id: canchaId,
        fecha,
        hora_inicio: hIni,
        hora_fin: hFin,
        disponible: true,
      },
      include: { reserva_items: true },
    });
  },

  async crearReservaConItems(params: {
    usuarioId: string;
    items: { horarioId: string; precioUnit: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const reserva = await tx.reservas.create({
        data: {
          usuario_id: params.usuarioId,
          estado: 'pendiente',
        },
      });

      // inserta items; el @@unique([horario_id]) previene doble reserva
      let total = 0;
      for (const it of params.items) {
        await tx.reserva_items.create({
          data: {
            reserva_id: reserva.id,
            horario_id: it.horarioId,
            precio: it.precioUnit,
          },
        });
        total += Number(it.precioUnit);
      }

      // (opcional) podrías guardar total en pagos cuando implementes pagos
      return { ...reserva, total };
    });
  },

  async misReservas(usuarioId: string, estado?: 'pendiente'|'confirmada'|'cancelada') {
    return prisma.reservas.findMany({
      where: { usuario_id: usuarioId, ...(estado ? { estado } : {}) },
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          include: { horario: { include: { cancha: { include: { complejo: true } } } } },
        },
        pagos: true,
      },
    });
  },

  async detalle(id: string, usuarioId: string) {
    return prisma.reservas.findFirst({
      where: { id, usuario_id: usuarioId },
      include: {
        items: {
          include: { horario: { include: { cancha: { include: { complejo: true } } } } },
        },
        pagos: true,
      },
    });
  },

  async cancelar(id: string, usuarioId: string) {
    // Importante: eliminar items para que disponibilidad vuelva a estar libre,
    // ya que tu endpoint de disponibilidad se fija en reserva_items.
    return prisma.$transaction(async (tx) => {
      const r = await tx.reservas.findFirst({ where: { id, usuario_id: usuarioId } });
      if (!r) return null;

      await tx.reserva_items.deleteMany({ where: { reserva_id: id } });
      await tx.reservas.update({ where: { id }, data: { estado: 'cancelada' } });
      return true;
    });
  },
};
