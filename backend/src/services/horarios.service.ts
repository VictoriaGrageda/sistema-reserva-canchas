import { HorariosRepo } from '../repositories/horarios.repo';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

type SlotInput = {
  fecha: string;          // "YYYY-MM-DD"
  hora_inicio: string;    // "08:00:00"
  hora_fin: string;       // "09:00:00"
  disponible?: boolean;
  precio?: number;        // Precio del slot
  es_diurno?: boolean;    // true = diurno, false = nocturno
};

type ConfiguracionHorario = {
  dia_semana: string;     // "LUNES", "MARTES", etc.
  hora_inicio: string;    // "06:00"
  hora_fin: string;       // "23:00"
};

const toDate = (t: string) => new Date(`1970-01-01T${t}Z`);

/**
 * Mapea día de la semana (0=domingo, 1=lunes, ..., 6=sábado) a enum DiaSemana
 */
const getDayName = (dayOfWeek: number): string => {
  const days = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
  return days[dayOfWeek];
};

/**
 * Determina si una hora es diurna o nocturna según horaCorte
 * @param hora - hora en formato "HH:MM"
 * @param horaCorte - hora de corte en formato "HH:MM" (default: "18:00")
 * @returns true si es diurno, false si es nocturno
 */
const esDiurno = (hora: string, horaCorte: string = "18:00"): boolean => {
  const [h, m] = hora.split(":").map(Number);
  const [hCorte, mCorte] = horaCorte.split(":").map(Number);

  const minutos = h * 60 + m;
  const minutosCorte = hCorte * 60 + mCorte;

  return minutos < minutosCorte;
};

/**
 * Genera bloques horarios de 1 hora a partir de un rango
 * @param horaInicio - "06:00"
 * @param horaFin - "23:00"
 * @returns array de bloques [{ inicio: "06:00", fin: "07:00" }, ...]
 */
const generarBloquesDeUnaHora = (horaInicio: string, horaFin: string) => {
  const bloques: { inicio: string; fin: string }[] = [];

  const [hInicio, mInicio] = horaInicio.split(":").map(Number);
  const [hFin, mFin] = horaFin.split(":").map(Number);

  let currentH = hInicio;
  let currentM = mInicio;

  const endMinutes = hFin * 60 + mFin;

  while (true) {
    const currentMinutes = currentH * 60 + currentM;
    const nextMinutes = currentMinutes + 60; // Sumar 1 hora (60 minutos)

    // Si el siguiente bloque excede el fin, salir
    if (nextMinutes > endMinutes) break;

    const nextH = Math.floor(nextMinutes / 60);
    const nextM = nextMinutes % 60;

    const inicio = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
    const fin = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;

    bloques.push({ inicio, fin });

    currentH = nextH;
    currentM = nextM;
  }

  return bloques;
};

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

  /**
   * 🆕 Genera bloques horarios automáticamente para una cancha
   * Basado en configuraciones_horarios definidas por el admin
   *
   * @param cancha_id - ID de la cancha
   * @param configuraciones - Array de configuraciones horarias (día_semana, hora_inicio, hora_fin)
   * @param diasAGenerar - Número de días en adelante (default: 30)
   * @param horaCorte - Hora de corte para diurno/nocturno (default: "18:00")
   */
  async generarBloquesAutomaticos(params: {
    cancha_id: string;
    configuraciones: ConfiguracionHorario[];
    diasAGenerar?: number;
    horaCorte?: string;
  }) {
    const { cancha_id, configuraciones, diasAGenerar = 30, horaCorte = "18:00" } = params;

    if (!configuraciones || configuraciones.length === 0) {
      throw new Error("Se requieren configuraciones de horarios");
    }

    // Obtener datos de la cancha para los precios
    const cancha = await prisma.canchas.findUnique({
      where: { id: cancha_id },
      include: { complejo: true },
    });

    if (!cancha) {
      throw new Error("Cancha no encontrada");
    }

    // Determinar precios (con fallback a complejo si existe)
    const precioDiurno = cancha.precioDiurnoPorHora
      ? Number(cancha.precioDiurnoPorHora)
      : cancha.complejo?.precioDiurnoPorHora
        ? Number(cancha.complejo.precioDiurnoPorHora)
        : 50;

    const precioNocturno = cancha.precioNocturnoPorHora
      ? Number(cancha.precioNocturnoPorHora)
      : cancha.complejo?.precioNocturnoPorHora
        ? Number(cancha.complejo.precioNocturnoPorHora)
        : 70;

    const horaCorteCancha = cancha.horaCorte || horaCorte;

    // Generar slots para los próximos N días
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots: SlotInput[] = [];

    for (let dayOffset = 1; dayOffset <= diasAGenerar; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);

      const dayOfWeek = currentDate.getDay(); // 0=domingo, 1=lunes, ...
      const dayName = getDayName(dayOfWeek);

      // Buscar configuraciones para este día
      const configsDelDia = configuraciones.filter(c => c.dia_semana === dayName);

      for (const config of configsDelDia) {
        // Generar bloques de 1 hora
        const bloques = generarBloquesDeUnaHora(config.hora_inicio, config.hora_fin);

        for (const bloque of bloques) {
          const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

          // Determinar si es diurno o nocturno
          const isDiurno = esDiurno(bloque.inicio, horaCorteCancha);
          const precio = isDiurno ? precioDiurno : precioNocturno;

          slots.push({
            fecha: dateStr,
            hora_inicio: `${bloque.inicio}:00`, // "06:00:00"
            hora_fin: `${bloque.fin}:00`,       // "07:00:00"
            disponible: true,
            precio: precio,
            es_diurno: isDiurno,
          });
        }
      }
    }

    if (slots.length === 0) {
      return { message: "No se generaron slots (sin configuraciones coincidentes)", count: 0 };
    }

    // Crear en bulk usando transacción
    const createdIds = await HorariosRepo.createMany({ cancha_id, slots });

    return {
      message: `Se generaron ${createdIds.length} bloques horarios para los próximos ${diasAGenerar} días`,
      count: createdIds.length,
      ids: createdIds,
    };
  },

  /**
   * 🆕 Guarda configuraciones de horarios para una cancha
   * @param cancha_id - ID de la cancha
   * @param configuraciones - Array de configuraciones { dia_semana, hora_inicio, hora_fin }
   */
  async guardarConfiguraciones(cancha_id: string, configuraciones: ConfiguracionHorario[]) {
    // Eliminar configuraciones anteriores
    await prisma.configuraciones_horarios.deleteMany({
      where: { cancha_id },
    });

    // Crear nuevas configuraciones
    const creadas = await prisma.configuraciones_horarios.createMany({
      data: configuraciones.map(c => ({
        cancha_id,
        dia_semana: c.dia_semana as any,
        hora_inicio: c.hora_inicio,
        hora_fin: c.hora_fin,
      })),
    });

    return { count: creadas.count };
  },

  /**
   * 🆕 Obtiene configuraciones de horarios de una cancha
   */
  async obtenerConfiguraciones(cancha_id: string) {
    return prisma.configuraciones_horarios.findMany({
      where: { cancha_id },
      orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    });
  },

  /**
   * 🆕 Activar/desactivar horarios (para mantenimiento/eventos)
   * Solo afecta horarios futuros sin reservas confirmadas
   */
  async cambiarDisponibilidad(params: {
    cancha_id: string;
    fecha_desde: string; // YYYY-MM-DD
    fecha_hasta: string; // YYYY-MM-DD
    disponible: boolean;
    hora_inicio?: string; // Opcional: para afectar solo ciertos horarios
    hora_fin?: string;
  }) {
    const { cancha_id, fecha_desde, fecha_hasta, disponible, hora_inicio, hora_fin } = params;

    const whereClause: any = {
      cancha_id,
      fecha: {
        gte: new Date(fecha_desde),
        lte: new Date(fecha_hasta),
      },
      reserva_items: {
        none: {}, // Solo horarios sin reservas
      },
    };

    // Si se especifican horas, filtrar por rango
    if (hora_inicio && hora_fin) {
      const ini = toDate(`${hora_inicio}:00`);
      const fin = toDate(`${hora_fin}:00`);

      whereClause.AND = [
        { hora_inicio: { gte: ini } },
        { hora_fin: { lte: fin } },
      ];
    }

    const updated = await prisma.horarios.updateMany({
      where: whereClause,
      data: { disponible },
    });

    return {
      message: `Se ${disponible ? 'activaron' : 'desactivaron'} ${updated.count} horarios`,
      count: updated.count,
    };
  },
};
