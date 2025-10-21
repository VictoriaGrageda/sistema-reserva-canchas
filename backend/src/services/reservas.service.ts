import { ReservasRepo } from '../repositories/reservas.repo';
import { PreciosService } from './precios.service';

function toSlot(h: any) {
  return {
    id: h.id,
    horaIni: h.hora_inicio.toISOString().slice(11, 16),
    horaFin: h.hora_fin.toISOString().slice(11, 16),
  };
}

export const ReservasService = {
  async crear(usuarioId: string, items: { canchaId: string; fecha: string; inicio: string; fin: string }[]) {
    // 1) encontrar horarios exactos y verificar que no tengan reserva_items
    const horarios: any[] = [];
    for (const it of items) {
      const horario = await ReservasRepo.findHorarioExacto(it.canchaId, it.fecha, it.inicio, it.fin);
      if (!horario) {
        throw { code: 404, message: `No existe horario disponible para ${it.canchaId} ${it.fecha} ${it.inicio}-${it.fin}` };
      }
      if (horario.reserva_items && horario.reserva_items.length > 0) {
        throw { code: 409, message: `El horario ${it.inicio}-${it.fin} ya fue tomado` };
      }
      horarios.push(horario);
    }

    // 2) precificar usando tu PreciosService (por cancha)
    //    agrupamos por cancha para llamar una sola vez por cancha (opcional)
    const itemsConPrecio: { horarioId: string; precioUnit: number }[] = [];
    const byCancha = new Map<string, any[]>();
    for (const h of horarios) {
      const c = String(h.cancha_id);
      if (!byCancha.has(c)) byCancha.set(c, []);
      byCancha.get(c)!.push(toSlot(h));
    }

    for (const [canchaId, slots] of byCancha.entries()) {
      const priced = await PreciosService.precificarSlots(canchaId, slots);
      for (const p of priced) {
        const h = horarios.find((x) => x.id === p.id)!;
        itemsConPrecio.push({ horarioId: h.id, precioUnit: Number(p.precioBs) });
      }
    }

    // 3) crear reserva + items en transacción (la unique de horario_id nos protege de carreras)
    const reserva = await ReservasRepo.crearReservaConItems({ usuarioId, items: itemsConPrecio });
    return reserva;
  },

  async misReservas(usuarioId: string, estado?: 'pendiente'|'confirmada'|'cancelada') {
    return ReservasRepo.misReservas(usuarioId, estado);
  },

  async detalle(id: string, usuarioId: string) {
    return ReservasRepo.detalle(id, usuarioId);
  },

  async cancelar(id: string, usuarioId: string) {
    const ok = await ReservasRepo.cancelar(id, usuarioId);
    if (!ok) throw { code: 404, message: 'Reserva no encontrada' };
    return { ok: true };
  },
};
