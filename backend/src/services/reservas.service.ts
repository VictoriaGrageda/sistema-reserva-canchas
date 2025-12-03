import { ReservasRepo } from '../repositories/reservas.repo';
import { PrismaClient } from '../generated/prisma';
import { PreciosService } from './precios.service';
import type { CrearReservaInput, ModificarReservaInput } from '../validations/reservas.schema';

const prisma = new PrismaClient();

type TipoReserva = 'diaria' | 'mensual' | 'recurrente';

/**
 * Mapea dÃ­a de la semana (0=domingo, 1=lunes, ..., 6=sÃ¡bado) a enum DiaSemana
 */
const getDayName = (dayOfWeek: number): string => {
  const days = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
  return days[dayOfWeek];
};

type MonthlyRange = {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

type SlotDescriptor = {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
};

const toDateOnly = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
};

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date(year, month - 1, day);
  result.setHours(0, 0, 0, 0);
  return result;
};

const parseHHMM = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatHHMM = (minutes: number) => {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60) % 24;
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const expandRangeToHourlySegments = (range: MonthlyRange) => {
  const segments: MonthlyRange[] = [];
  let start = parseHHMM(range.hora_inicio);
  let end = parseHHMM(range.hora_fin);
  if (end <= start) {
    end += 24 * 60;
  }
  for (let cursor = start; cursor < end; cursor += 60) {
    segments.push({
      dia_semana: range.dia_semana,
      hora_inicio: formatHHMM(cursor),
      hora_fin: formatHHMM(cursor + 60),
    });
  }
  return segments;
};

const buildSegmentsFromParams = (params: {
  rangos?: MonthlyRange[];
  dias_semana?: string[];
  dia_semana?: string;
  hora_inicio?: string;
  hora_fin?: string;
}) => {
  const baseRanges: MonthlyRange[] = [];
  if (Array.isArray(params.rangos) && params.rangos.length > 0) {
    params.rangos.forEach((range) => {
      baseRanges.push({
        dia_semana: String(range.dia_semana).toUpperCase(),
        hora_inicio: range.hora_inicio,
        hora_fin: range.hora_fin,
      });
    });
  } else if (
    (params.dia_semana || (Array.isArray(params.dias_semana) && params.dias_semana.length > 0)) &&
    params.hora_inicio &&
    params.hora_fin
  ) {
    const dias = params.dia_semana ? [params.dia_semana] : params.dias_semana || [];
    dias.forEach((dia) => {
      baseRanges.push({
        dia_semana: String(dia).toUpperCase(),
        hora_inicio: params.hora_inicio!,
        hora_fin: params.hora_fin!,
      });
    });
  }
  const normalized: MonthlyRange[] = [];
  const seen = new Set<string>();
  baseRanges.forEach((range) => {
    expandRangeToHourlySegments(range).forEach((segment) => {
      const key = `${segment.dia_semana}|${segment.hora_inicio}|${segment.hora_fin}`;
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(segment);
      }
    });
  });
  return normalized;
};

const getDefaultPeriod = () => {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 29);
  return { inicio, fin };
};

const getPeriodRange = (inicio?: string, fin?: string) => {
  if (inicio && fin) {
    return { inicio: parseDateOnly(inicio), fin: parseDateOnly(fin) };
  }
  return getDefaultPeriod();
};

const buildExpectedSlots = (
  segments: MonthlyRange[],
  period: { inicio: Date; fin: Date }
) => {
  const slots: SlotDescriptor[] = [];
  const cursor = new Date(period.inicio);
  while (cursor <= period.fin) {
    const dayName = getDayName(cursor.getDay());
    segments.forEach((segment) => {
      if (segment.dia_semana === dayName) {
        slots.push({
          fecha: toDateOnly(cursor),
          hora_inicio: segment.hora_inicio,
          hora_fin: segment.hora_fin,
        });
      }
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
};

const buildSlotKey = (slot: SlotDescriptor) => `${slot.fecha}|${slot.hora_inicio}|${slot.hora_fin}`;

const buildHorarioKey = (horario: any) => {
  const fecha =
    horario.fecha instanceof Date ? toDateOnly(horario.fecha) : String(horario.fecha);
  const horaInicio = horario.hora_inicio.toISOString().substring(11, 16);
  const horaFin = horario.hora_fin.toISOString().substring(11, 16);
  return `${fecha}|${horaInicio}|${horaFin}`;
};

const matchSlots = (expected: SlotDescriptor[], horarios: any[]) => {
  const lookup = new Map<string, any>();
  horarios.forEach((horario) => {
    lookup.set(buildHorarioKey(horario), horario);
  });

  const available: any[] = [];
  const missing: SlotDescriptor[] = [];
  expected.forEach((slot) => {
    const key = buildSlotKey(slot);
    const match = lookup.get(key);
    if (match) {
      available.push(match);
    } else {
      missing.push(slot);
    }
  });

  return { availableSlots: available, missingSlots: missing };
};

const assignPricesToSlots = async (
  canchaId: string,
  slots: any[],
  overridePrecio?: number
) => {
  const datos = slots.map((slot) => ({
    horario_id: slot.id,
    precio: overridePrecio ?? (slot.precio != null ? Number(slot.precio) : undefined),
  }));

  const withoutPrice = slots.filter((slot, idx) => datos[idx].precio == null);
  if (withoutPrice.length > 0) {
    const precificados = await PreciosService.precificarSlots(
      canchaId,
      withoutPrice.map((slot) => ({
        id: slot.id,
        horaIni: slot.hora_inicio.toISOString().substring(11, 16),
        horaFin: slot.hora_fin.toISOString().substring(11, 16),
      }))
    );
    const priceMap = new Map(precificados.map((p) => [p.id, p.precioBs]));
    datos.forEach((item) => {
      if (item.precio == null) {
        item.precio = priceMap.get(item.horario_id) || 0;
      }
    });
  }

  const slotsWithPrice = slots.map((slot, idx) => ({
    id: slot.id,
    fecha: slot.fecha,
    hora_inicio: slot.hora_inicio,
    hora_fin: slot.hora_fin,
    precio: Number(datos[idx].precio || 0),
  }));

  return { horariosData: datos, slotsWithPrice };
};

export const ReservasService = {
  /**
   * Crear una nueva reserva
   * @param usuario_id - ID del usuario autenticado
   * @param data - Datos de la reserva (horarios, tipo_reserva, etc.)
   */
  async crear(usuario_id: string, data: CrearReservaInput & { tipo_reserva?: TipoReserva; recurrencia_dia_semana?: string; recurrencia_hora?: string }) {
    try {
      const tipo_reserva = data.tipo_reserva || 'diaria';

      // Validar segÃºn tipo de reserva
      if (tipo_reserva === 'diaria') {
        // Validar que las reservas sean para el futuro (mÃ­nimo maÃ±ana, mÃ¡ximo 30 dÃ­as)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);

        const limiteMaximo = new Date(hoy);
        limiteMaximo.setDate(hoy.getDate() + 30);

        // Verificar que todos los horarios estÃ©n en el rango permitido
        for (const item of data.horarios) {
          const horario = await prisma.horarios.findUnique({
            where: { id: item.horario_id },
          });

          if (!horario) {
            throw new Error(`Horario ${item.horario_id} no encontrado`);
          }

          // Crear fecha en hora local para evitar problemas de zona horaria
          const fechaStr = horario.fecha.toISOString().split('T')[0]; // "YYYY-MM-DD"
          const [year, month, day] = fechaStr.split('-').map(Number);
          const fechaHorario = new Date(year, month - 1, day);
          fechaHorario.setHours(0, 0, 0, 0);

          console.log('ðŸ” Validando fecha de horario:', {
            horario_id: item.horario_id,
            fechaStr,
            fechaHorario: fechaHorario.toISOString(),
            manana: manana.toISOString(),
            limiteMaximo: limiteMaximo.toISOString(),
          });

          // Validar que la fecha sea desde maÃ±ana hasta 30 dÃ­as
          if (fechaHorario.getTime() < manana.getTime()) {
            throw new Error('Las reservas diarias deben hacerse con al menos 1 dÃ­a de anticipaciÃ³n');
          }

          if (fechaHorario.getTime() > limiteMaximo.getTime()) {
            throw new Error('Las reservas diarias solo pueden hacerse hasta 30 dÃ­as en el futuro');
          }
        }
      }

      if (tipo_reserva === 'recurrente') {
        // Para reservas recurrentes, se requiere dÃ­a de semana y hora
        if (!data.recurrencia_dia_semana || !data.recurrencia_hora) {
          throw new Error('Para reservas recurrentes se requiere especificar dÃ­a de la semana y hora');
        }
      }

      const reserva = await ReservasRepo.crearConItems(usuario_id, data.horarios, {
        tipo_reserva,
        recurrencia_dia_semana: data.recurrencia_dia_semana,
        recurrencia_hora: data.recurrencia_hora,
      });

      return reserva;
    } catch (error: any) {
      // Propagar el error con mensaje claro
      throw new Error(error.message || 'Error al crear la reserva');
    }
  },

  /**
   * ðŸ†• Crear reserva mensual
   * Bloquea horarios durante todo el mes para los mismos dÃ­as de la semana y hora
   */
    /**
   * ðŸ†• Crear reserva mensual
   * Bloquea horarios durante todo el mes en los dÃ­as configurados
   */
  async crearMensual(
    usuario_id: string,
    params: {
      cancha_id: string;
      dia_semana?: string;
      dias_semana?: string[];
      hora_inicio?: string;
      hora_fin?: string;
      rangos?: MonthlyRange[];
      precio?: number;
      fecha_inicio?: string;
      fecha_fin?: string;
      tipo_plan?: string;
    }
  ) {
    try {
      const { cancha_id, precio, tipo_plan } = params;
      const segments = buildSegmentsFromParams(params);
      if (segments.length === 0) {
        const err: any = new Error('Debe indicar al menos un horario para la mensualidad');
        err.status = 400;
        throw err;
      }

      const period = getPeriodRange(params.fecha_inicio, params.fecha_fin);
      const expectedSlots = buildExpectedSlots(segments, period);
      if (expectedSlots.length === 0) {
        const err: any = new Error('No hay sesiones configuradas para el periodo seleccionado');
        err.status = 400;
        throw err;
      }

      const horarios = await prisma.horarios.findMany({
        where: {
          cancha_id,
          fecha: {
            gte: period.inicio,
            lte: period.fin,
          },
          disponible: true,
          reserva_items: {
            none: {},
          },
        },
      });

      const { availableSlots, missingSlots } = matchSlots(expectedSlots, horarios);
if (availableSlots.length === 0) {
        const err: any = new Error('No se encontraron horarios disponibles para la mensualidad');
        err.status = 400;
        throw err;
      }

      const { horariosData, slotsWithPrice } = await assignPricesToSlots(
        cancha_id,
        availableSlots,
        precio
      );

      const total = slotsWithPrice.reduce(
        (sum, slot) => sum + (Number(slot.precio) || 0),
        0
      );

      const reserva = await ReservasRepo.crearConItems(usuario_id, horariosData, {
        tipo_reserva: 'mensual',
        extraAfterCreate: async (tx, reservaId) => {
          await (tx as any).mensualidades.create({
            data: {
              reserva_id: reservaId,
              usuario_id,
              cancha_id,
              tipo_plan: tipo_plan ?? 'horario_fijo_semanal',
              fecha_inicio: period.inicio,
              fecha_fin: period.fin,
              sesiones: slotsWithPrice.length,
              monto_total: total,
              rangos: segments,
            },
          });
        },
      });

      (reserva as any).missingSlots = missingSlots;
      return reserva;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear la reserva mensual');
    }
  },
  async previewMensual(params: {
    cancha_id: string;
    dia_semana?: string;
    dias_semana?: string[];
    hora_inicio?: string;
    hora_fin?: string;
    rangos?: MonthlyRange[];
    precio?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_plan?: string;
  }) {
    const { cancha_id, tipo_plan, precio } = params;
    const segments = buildSegmentsFromParams(params);
    const period = getPeriodRange(params.fecha_inicio, params.fecha_fin);

    if (segments.length === 0) {
      return {
        count: 0,
        total: 0,
        slots: [],
        expected: 0,
        missing: [],
        periodo: {
          inicio: toDateOnly(period.inicio),
          fin: toDateOnly(period.fin),
        },
        tipo_plan: tipo_plan ?? 'horario_fijo_semanal',
      };
    }

    const expectedSlots = buildExpectedSlots(segments, period);
    const horarios = await prisma.horarios.findMany({
      where: {
        cancha_id,
        fecha: {
          gte: period.inicio,
          lte: period.fin,
        },
        disponible: true,
        reserva_items: {
          none: {},
        },
      },
    });

    const { availableSlots, missingSlots } = matchSlots(expectedSlots, horarios);
    const { slotsWithPrice } = await assignPricesToSlots(cancha_id, availableSlots, precio);

    const sortedSlots = [...slotsWithPrice].sort((a, b) => {
      const fechaA = a.fecha instanceof Date ? a.fecha.getTime() : new Date(a.fecha).getTime();
      const fechaB = b.fecha instanceof Date ? b.fecha.getTime() : new Date(b.fecha).getTime();
      if (fechaA !== fechaB) return fechaA - fechaB;
      const horaA = a.hora_inicio instanceof Date ? a.hora_inicio.getTime() : new Date(a.hora_inicio).getTime();
      const horaB = b.hora_inicio instanceof Date ? b.hora_inicio.getTime() : new Date(b.hora_inicio).getTime();
      return horaA - horaB;
    });

    const total = sortedSlots.reduce((sum, slot) => sum + (Number(slot.precio) || 0), 0);

    return {
      count: sortedSlots.length,
      total,
      slots: sortedSlots,
      expected: expectedSlots.length,
      missing: missingSlots,
      periodo: {
        inicio: toDateOnly(period.inicio),
        fin: toDateOnly(period.fin),
      },
      tipo_plan: tipo_plan ?? 'horario_fijo_semanal',
    };
  },
async crearRecurrente(
    usuario_id: string,
    params: {
      cancha_id: string;
      dia_semana: string; // "LUNES", "MARTES", etc.
      hora_inicio: string; // "20:00"
      hora_fin: string; // "21:00"
      precio?: number;
    }
  ) {
    const { cancha_id, dia_semana, hora_inicio, hora_fin, precio } = params;

    // Similar a mensual, pero se marca como recurrente para que se renueve automÃ¡ticamente
    const reservaMensual = await this.crearMensual(usuario_id, params);
    if (!reservaMensual) {
      throw new Error('Error al crear la reserva mensual para recurrente');
    }
    // Actualizar a tipo recurrente
    const reservaRecurrente = await prisma.reservas.update({
      where: { id: reservaMensual.id },
      data: {
        tipo_reserva: 'recurrente',
        recurrencia_dia_semana: dia_semana as any,
        recurrencia_hora: hora_inicio,
      },
      include: {
        items: {
          include: {
            horario: {
              include: {
                cancha: {
                  include: {
                    complejo: true,
                  },
                },
              },
            },
          },
        },
        pagos: true,
        usuario: true,
      },
    });

    return reservaRecurrente;
  },

  /**
   * Obtener el historial de reservas del usuario
   */
  async misReservas(
    usuario_id: string,
    filters: { estado?: string; limit?: number; offset?: number }
  ) {
    return ReservasRepo.listarPorUsuario(usuario_id, filters);
  },

  /**
   * Obtener detalle de una reserva especÃ­fica
   * Valida que la reserva pertenezca al usuario
   */
  async obtenerDetalle(reserva_id: string, usuario_id: string) {
    const reserva = await ReservasRepo.obtenerPorId(reserva_id);

    if (!reserva) {
      const err: any = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }

    // Verificar que la reserva pertenezca al usuario
    if (reserva.usuario_id !== usuario_id) {
      const err: any = new Error('No tienes permiso para ver esta reserva');
      err.status = 403;
      throw err;
    }

    return reserva;
  },

  /**
   * Modificar una reserva (cambiar horarios)
   * Valida que:
   * - La reserva exista y pertenezca al usuario
   * - EstÃ© en estado pendiente
   * - No haya pasado el plazo de modificaciÃ³n (opcional)
   */
  async modificar(reserva_id: string, usuario_id: string, data: ModificarReservaInput) {
    // Verificar que la reserva exista y pertenezca al usuario
    const reservaActual = await ReservasRepo.obtenerPorId(reserva_id);

    if (!reservaActual) {
      const err: any = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }

    if (reservaActual.usuario_id !== usuario_id) {
      const err: any = new Error('No tienes permiso para modificar esta reserva');
      err.status = 403;
      throw err;
    }

    if (reservaActual.estado !== 'pendiente') {
      const err: any = new Error('Solo se pueden modificar reservas en estado pendiente');
      err.status = 400;
      throw err;
    }

    // TODO: Agregar validaciÃ³n de plazo lÃ­mite (ej: 24h antes del primer horario)
    // const primerHorario = reservaActual.items[0]?.horario;
    // if (primerHorario) {
    //   const fechaHorario = new Date(primerHorario.fecha);
    //   const ahora = new Date();
    //   const horasRestantes = (fechaHorario.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    //   if (horasRestantes < 24) {
    //     throw new Error('No se puede modificar la reserva con menos de 24 horas de anticipaciÃ³n');
    //   }
    // }

    try {
      const reservaModificada = await ReservasRepo.modificarHorarios(reserva_id, data.horarios);
      return reservaModificada;
    } catch (error: any) {
      const err: any = new Error(error.message || 'Error al modificar la reserva');
      err.status = 400;
      throw err;
    }
  },

  /**
   * Cancelar una reserva
   * Valida que la reserva pertenezca al usuario
   */
  async cancelar(reserva_id: string, usuario_id: string) {
    // Verificar que la reserva exista y pertenezca al usuario
    const reserva = await ReservasRepo.obtenerPorId(reserva_id);

    if (!reserva) {
      const err: any = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }

    if (reserva.usuario_id !== usuario_id) {
      const err: any = new Error('No tienes permiso para cancelar esta reserva');
      err.status = 403;
      throw err;
    }

    if (reserva.estado === 'cancelada') {
      const err: any = new Error('Esta reserva ya estÃ¡ cancelada');
      err.status = 400;
      throw err;
    }

    // TODO: Agregar validaciÃ³n de plazo lÃ­mite para cancelaciÃ³n
    // Por ejemplo, no permitir cancelar si falta menos de X horas

    try {
      const reservaCancelada = await ReservasRepo.cancelar(reserva_id);
      return reservaCancelada;
    } catch (error: any) {
      const err: any = new Error(error.message || 'Error al cancelar la reserva');
      err.status = 400;
      throw err;
    }
  },

  /**
   * Listar reservas del panel de administrador
   * Muestra reservas de los complejos que pertenecen al admin
   */
  async listarPorAdmin(
    admin_id: string,
    filters: { complejo_id?: string; estado?: string; fecha?: string }
  ) {
    return ReservasRepo.listarPorAdmin(admin_id, filters);
  },

  /**
   * Cambiar estado de una reserva (admin)
   * Valida que el admin sea dueÃ±o del complejo
   */
  async cambiarEstado(
    reserva_id: string,
    admin_id: string,
    estado: 'confirmada' | 'cancelada'
  ) {
    // Obtener la reserva
    const reserva = await ReservasRepo.obtenerPorId(reserva_id);

    if (!reserva) {
      const err: any = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }

    // Verificar que el admin sea dueÃ±o de la cancha (complejo o individual)
      const primerItem = (reserva as any).items[0] as any;
    if (!primerItem) {
      const err: any = new Error('Reserva sin horarios');
      err.status = 400;
      throw err;
    }

    const cancha = primerItem.horario.cancha;
    const adminDueno = cancha.complejo?.admin_id || cancha.admin_id;

    if (adminDueno !== admin_id) {
      const err: any = new Error('No tienes permiso para modificar esta reserva');
      err.status = 403;
      throw err;
    }

    try {
      const reservaActualizada = await ReservasRepo.cambiarEstado(reserva_id, estado);
      return reservaActualizada;
    } catch (error: any) {
      const err: any = new Error(error.message || 'Error al cambiar estado de la reserva');
      err.status = 400;
      throw err;
    }
  },
};

