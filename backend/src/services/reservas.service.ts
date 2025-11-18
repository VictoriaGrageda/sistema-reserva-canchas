import { ReservasRepo } from '../repositories/reservas.repo';
import { PrismaClient } from '@prisma/client';
import { PreciosService } from './precios.service';
import type { CrearReservaInput, ModificarReservaInput } from '../validations/reservas.schema';

const prisma = new PrismaClient();

type TipoReserva = 'diaria' | 'mensual' | 'recurrente';

/**
 * Mapea día de la semana (0=domingo, 1=lunes, ..., 6=sábado) a enum DiaSemana
 */
const getDayName = (dayOfWeek: number): string => {
  const days = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
  return days[dayOfWeek];
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

      // Validar según tipo de reserva
      if (tipo_reserva === 'diaria') {
        // Validar que las reservas sean para el futuro (mínimo mañana, máximo 30 días)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);

        const limiteMaximo = new Date(hoy);
        limiteMaximo.setDate(hoy.getDate() + 30);

        // Verificar que todos los horarios estén en el rango permitido
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

          console.log('🔍 Validando fecha de horario:', {
            horario_id: item.horario_id,
            fechaStr,
            fechaHorario: fechaHorario.toISOString(),
            manana: manana.toISOString(),
            limiteMaximo: limiteMaximo.toISOString(),
          });

          // Validar que la fecha sea desde mañana hasta 30 días
          if (fechaHorario.getTime() < manana.getTime()) {
            throw new Error('Las reservas diarias deben hacerse con al menos 1 día de anticipación');
          }

          if (fechaHorario.getTime() > limiteMaximo.getTime()) {
            throw new Error('Las reservas diarias solo pueden hacerse hasta 30 días en el futuro');
          }
        }
      }

      if (tipo_reserva === 'recurrente') {
        // Para reservas recurrentes, se requiere día de semana y hora
        if (!data.recurrencia_dia_semana || !data.recurrencia_hora) {
          throw new Error('Para reservas recurrentes se requiere especificar día de la semana y hora');
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
   * 🆕 Crear reserva mensual
   * Bloquea horarios durante todo el mes para los mismos días de la semana y hora
   */
  async crearMensual(
    usuario_id: string,
    params: {
      cancha_id: string;
      dia_semana?: string; // legacy: un único día
      dias_semana?: string[]; // nuevo: múltiples días
      hora_inicio: string; // "20:00"
      hora_fin: string; // "21:00"
      precio?: number;
    }
  ) {
    const { cancha_id, dia_semana, dias_semana, hora_inicio, hora_fin, precio } = params;

    // Obtener horarios disponibles para todo el mes
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Último día del mes

    const horarios = await prisma.horarios.findMany({
      where: {
        cancha_id,
        fecha: {
          gte: hoy,
          lte: finMes,
        },
        disponible: true,
        reserva_items: {
          none: {},
        },
      },
    });

    // Filtrar por día de la semana y hora
    const horariosCoincidentes = horarios.filter((h) => {
      const fecha = new Date(h.fecha);
      const dayOfWeek = fecha.getDay();
      const dayName = getDayName(dayOfWeek);

      // Verificar día de la semana
      if (Array.isArray(dias_semana) && dias_semana.length > 0) {
        if (!dias_semana.map(String).map((d) => d.toUpperCase()).includes(dayName)) return false;
      } else {
        if (dayName !== dia_semana) return false;
      }

      // Verificar hora (simplificado, comparar strings)
      const horaInicioStr = h.hora_inicio.toISOString().substring(11, 16); // "HH:MM"
      const horaFinStr = h.hora_fin.toISOString().substring(11, 16);

      return horaInicioStr === hora_inicio && horaFinStr === hora_fin;
    });

    if (horariosCoincidentes.length === 0) {
      const _rangos = (params as any).rangos as Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }> | undefined;
      if (Array.isArray(_rangos) && _rangos.length > 0) {
        throw new Error('No se encontraron horarios disponibles para los rangos solicitados durante el mes');
      }
      const diasTxt = (Array.isArray(dias_semana) && dias_semana.length > 0)
        ? dias_semana.join(', ')
        : String(dia_semana);
      throw new Error(`No se encontraron horarios disponibles para ${diasTxt} a las ${hora_inicio}-${hora_fin} durante el mes`);
    }

    // Crear reserva con todos los horarios
    // Si no se proporciona precio y el slot no tiene precio, calculamos según diurno/nocturno
    let horariosData = horariosCoincidentes.map((h) => ({
      horario_id: h.id,
      precio: precio ?? (h.precio != null ? Number(h.precio) : undefined),
    }));

    const slotsSinPrecio = horariosCoincidentes
      .filter((h, idx) => horariosData[idx].precio == null)
      .map((h) => ({
        id: h.id,
        horaIni: h.hora_inicio.toISOString().substring(11, 16), // HH:MM
        horaFin: h.hora_fin.toISOString().substring(11, 16),
      }));

    if (slotsSinPrecio.length > 0) {
      const precificados = await PreciosService.precificarSlots(cancha_id, slotsSinPrecio);
      const precioPorId = new Map(precificados.map((p) => [p.id, p.precioBs]));
      horariosData = horariosData.map((d) =>
        d.precio != null ? d : { ...d, precio: precioPorId.get(d.horario_id) || 0 }
      );
    }

    const reserva = await ReservasRepo.crearConItems(usuario_id, horariosData, {
      tipo_reserva: 'mensual',
    });

    return reserva;
  },

  /**
   * Preview de reserva mensual: devuelve slots coincidentes y total calculado
   */
  async previewMensual(params: {
    cancha_id: string;
    dia_semana?: string;
    dias_semana?: string[];
    hora_inicio: string; // "HH:MM"
    hora_fin: string;    // "HH:MM"
    precio?: number;     // opcional precio fijo por slot
  }) {
    const { cancha_id, dia_semana, dias_semana, hora_inicio, hora_fin, precio } = params;

    // Ventana rodante de 28 días (4 semanas) anclada al lunes de la semana actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const anchor = new Date(hoy);
    const dow = anchor.getDay(); // 0=domingo, 1=lunes
    const deltaToMonday = (dow + 6) % 7; // 0 para lunes
    anchor.setDate(anchor.getDate() - deltaToMonday);
    const finVentana = new Date(anchor);
    finVentana.setDate(anchor.getDate() + 27); // 28 días (0..27)

    const horarios = await prisma.horarios.findMany({
      where: {
        cancha_id,
        fecha: { gte: anchor, lte: finVentana },
        disponible: true,
        reserva_items: { none: {} },
      },
    });

    let horariosCoincidentes = horarios;

    // Si se proporcionaron rangos y no hubo coincidencias con el filtro base, intentar recalcular por rangos
    const _rangos = (params as any).rangos as Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }> | undefined;
    if (Array.isArray(_rangos) && _rangos.length > 0) {
      const rangosNorm = _rangos.map((r) => ({
        dia: String(r.dia_semana).toUpperCase(),
        hIni: r.hora_inicio,
        hFin: r.hora_fin,
      }));
      const setIds = new Set<string>();
      const recalculados: typeof horarios = [];
      for (const h of horarios) {
        const fecha = new Date(h.fecha);
        const dayName = getDayName(fecha.getDay());
        const hIni = h.hora_inicio.toISOString().substring(11, 16);
        const hFin = h.hora_fin.toISOString().substring(11, 16);
        if (rangosNorm.some((r) => r.dia === dayName && r.hIni === hIni && r.hFin === hFin)) {
          if (!setIds.has(h.id)) { setIds.add(h.id); recalculados.push(h); }
        }
      }
      if (recalculados.length > 0) {
        horariosCoincidentes = recalculados;
      }
    }

    const rangos = (params as any).rangos as Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }> | undefined;
    let candidatos: typeof horarios = [];
    if (Array.isArray(rangos) && rangos.length > 0) {
      const rangosNorm = rangos.map((r) => ({
        dia: String(r.dia_semana).toUpperCase(),
        hIni: r.hora_inicio,
        hFin: r.hora_fin,
      }));
      const setIds = new Set<string>();
      for (const h of horarios) {
        const fecha = new Date(h.fecha);
        const dayName = getDayName(fecha.getDay());
        const hIni = h.hora_inicio.toISOString().substring(11, 16);
        const hFin = h.hora_fin.toISOString().substring(11, 16);
        if (rangosNorm.some((r) => r.dia === dayName && r.hIni === hIni && r.hFin === hFin)) {
          if (!setIds.has(h.id)) { setIds.add(h.id); candidatos.push(h); }
        }
      }
    } else {
      const diasPermitidos = new Set<string>(
        (Array.isArray(dias_semana) && dias_semana.length > 0 ? dias_semana : [dia_semana])
          .filter(Boolean)
          .map((d) => String(d).toUpperCase())
      );
      candidatos = horarios.filter((h) => {
        const fecha = new Date(h.fecha);
        const dayName = getDayName(fecha.getDay());
        if (!diasPermitidos.has(dayName)) return false;
        const horaInicioStr = h.hora_inicio.toISOString().substring(11, 16);
        const horaFinStr = h.hora_fin.toISOString().substring(11, 16);
        return horaInicioStr === hora_inicio && horaFinStr === hora_fin;
      });
    }

    if (candidatos.length === 0) {
      return { count: 0, total: 0, slots: [] as any[] };
    }

    // Determinar precio por slot
    let preciosMap = new Map<string, number>();
    if (precio != null) {
      candidatos.forEach((h) => preciosMap.set(h.id, Number(precio)));
    } else {
      const sinPrecio = candidatos.filter((h) => h.precio == null);
      if (sinPrecio.length > 0) {
        const precificados = await PreciosService.precificarSlots(
          cancha_id,
          sinPrecio.map((h) => ({
            id: h.id,
            horaIni: h.hora_inicio.toISOString().substring(11, 16),
            horaFin: h.hora_fin.toISOString().substring(11, 16),
          }))
        );
        precificados.forEach((p) => preciosMap.set(p.id, p.precioBs));
      }
      // Slots con precio ya definido en tabla horarios
      candidatos
        .filter((h) => h.precio != null)
        .forEach((h) => preciosMap.set(h.id, Number(h.precio)));
    }

    const slots = candidatos.map((h) => ({
      id: h.id,
      fecha: h.fecha,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      precio: preciosMap.get(h.id) || 0,
    }));
    const total = slots.reduce((s, it) => s + (Number(it.precio) || 0), 0);

    return { count: slots.length, total, slots };
  },

  /**
   * 🆕 Crear reserva recurrente
   * Repite el mismo día y hora cada mes (pago único por mes)
   */
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

    // Similar a mensual, pero se marca como recurrente para que se renueve automáticamente
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
   * Obtener detalle de una reserva específica
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
   * - Esté en estado pendiente
   * - No haya pasado el plazo de modificación (opcional)
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

    // TODO: Agregar validación de plazo límite (ej: 24h antes del primer horario)
    // const primerHorario = reservaActual.items[0]?.horario;
    // if (primerHorario) {
    //   const fechaHorario = new Date(primerHorario.fecha);
    //   const ahora = new Date();
    //   const horasRestantes = (fechaHorario.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    //   if (horasRestantes < 24) {
    //     throw new Error('No se puede modificar la reserva con menos de 24 horas de anticipación');
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
      const err: any = new Error('Esta reserva ya está cancelada');
      err.status = 400;
      throw err;
    }

    // TODO: Agregar validación de plazo límite para cancelación
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
   * Valida que el admin sea dueño del complejo
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

    // Verificar que el admin sea dueño de la cancha (complejo o individual)
    const primerItem = reserva.items[0];
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
