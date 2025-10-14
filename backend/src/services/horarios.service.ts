import { HorariosRepo } from '../repositories/horarios.repo';

const toDate = (t: string) => new Date(`1970-01-01T${t}Z`);

export const HorariosService = {
  async crear({ cancha_id, fecha, hora_inicio, hora_fin, disponible = true }: any) {
    const f = new Date(fecha);          // "YYYY-MM-DD"
    const ini = toDate(hora_inicio);    // "08:00:00"
    const fin = toDate(hora_fin);       // "09:00:00"
    if (Number.isNaN(f.getTime())) throw new Error('fecha inválida (YYYY-MM-DD)');
    if (fin <= ini) throw new Error('hora_fin debe ser mayor a hora_inicio');

    const overlap = await HorariosRepo.findOverlap(cancha_id, f, ini, fin);
    if (overlap) throw new Error('La franja se solapa con otra existente.');

    return HorariosRepo.create({ cancha_id, fecha: f, hora_inicio: ini, hora_fin: fin, disponible });
  },

  listar: (cancha_id: string, fecha: string) =>
    HorariosRepo.listByCanchaFecha(cancha_id, new Date(fecha)),

  eliminar: (id: string) => HorariosRepo.remove(id),
};
