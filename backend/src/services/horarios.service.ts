import { HorariosRepo } from '../repositories/horarios.repo';

type SlotInput = {
  fecha: string;          // "YYYY-MM-DD"
  hora_inicio: string;    // "08:00:00"
  hora_fin: string;       // "09:00:00"
  disponible?: boolean;
};

const toDate = (t: string) => new Date(`1970-01-01T${t}Z`);

export const HorariosService = {
  /** Crear un solo slot */
  async crear({ cancha_id, fecha, hora_inicio, hora_fin, disponible = true }: any) {
    const f = new Date(fecha);
    const ini = toDate(hora_inicio);
    const fin = toDate(hora_fin);

    if (Number.isNaN(f.getTime())) throw new Error('fecha inválida (YYYY-MM-DD)');
    if (fin <= ini) throw new Error('hora_fin debe ser mayor a hora_inicio');

    const overlap = await HorariosRepo.findOverlap(cancha_id, f, ini, fin);
    if (overlap) throw new Error('La franja se solapa con otra existente.');

    return HorariosRepo.create({ cancha_id, fecha: f, hora_inicio: ini, hora_fin: fin, disponible });
  },

  /** Crear varios slots en un solo request (bulk) */
  async crearBulk(payload: { cancha_id: string; slots: SlotInput[] }) {
    const { cancha_id, slots } = payload || ({} as any);

    if (!cancha_id || !Array.isArray(slots) || slots.length === 0) {
      throw new Error('Body inválido: se requiere { cancha_id, slots[] }');
    }

    // Validación básica local (formatos + orden)
    for (const s of slots) {
      const f = new Date(s.fecha);
      const ini = toDate(s.hora_inicio);
      const fin = toDate(s.hora_fin);

      if (Number.isNaN(f.getTime())) throw new Error(`fecha inválida: ${s.fecha}`);
      if (fin <= ini) throw new Error(`hora_fin debe ser mayor a hora_inicio (${s.hora_inicio} → ${s.hora_fin})`);
    }

    // Dejamos la verificación de solapes a nivel de repo en transacción
    // para evitar condiciones de carrera y garantizar atomicidad.
    // (Asegúrate de que HorariosRepo.createMany valide solapes como te pasé.)
    return HorariosRepo.createMany({ cancha_id, slots });
  },
  async editar(id: string, body: any) {
    if (body.hora_inicio && body.hora_fin) {
      const ini = toDate(body.hora_inicio);
      const fin = toDate(body.hora_fin);
      if (fin <= ini) throw new Error('hora_fin debe ser mayor a hora_inicio');
    }
    return HorariosRepo.updateOne(id, body);
  },

  /** Listar por cancha/fecha */
  listar: (cancha_id: string, fecha: string) =>
    HorariosRepo.listByCanchaFecha(cancha_id, new Date(fecha)),

  /** Eliminar slot */
  eliminar: (id: string) => HorariosRepo.remove(id),
};
