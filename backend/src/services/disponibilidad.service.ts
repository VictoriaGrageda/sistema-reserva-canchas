import { DisponibilidadRepo } from '../repositories/disponibilidad.repo';
import { PreciosService } from './precios.service';

export const DisponibilidadService = {
  async disponibilidadDia(canchaId: string, fechaISO: string) {
    const fecha = new Date(fechaISO);
    if (Number.isNaN(fecha.getTime())) {
      throw new Error('fecha inválida. Usa formato YYYY-MM-DD');
    }

    const slots = await DisponibilidadRepo.slotsLibres(canchaId, fecha);
    const slotsConPrecio = await PreciosService.precificarSlots(canchaId, slots);

    return {
      cancha_id: canchaId,
      fecha: fechaISO,
      slots: slotsConPrecio,
    };
  },
};
