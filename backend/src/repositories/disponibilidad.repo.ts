import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

/**
 * Devuelve horarios con disponible=true y SIN reserva_items asociados,
 * ordenados por hora de inicio ascendente.
 */
export const DisponibilidadRepo = {
  async slotsLibres(canchaId: string, fecha: Date) {
    const horarios = await prisma.horarios.findMany({
      where: { cancha_id: canchaId, fecha, disponible: true },
      orderBy: { hora_inicio: 'asc' },
      include: { reserva_items: true },
    });

    return horarios
      .filter((h: any) => (h.reserva_items?.length ?? 0) === 0) // tipado explícito para TS
      .map((h: any) => ({
        id: h.id,
        horaIni: h.hora_inicio.toISOString().slice(11, 16), // "HH:MM"
        horaFin: h.hora_fin.toISOString().slice(11, 16),
      }));
  },
};
