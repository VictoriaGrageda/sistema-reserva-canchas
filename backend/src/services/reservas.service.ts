import { ReservasRepo } from '../repositories/reservas.repo';
import type { CrearReservaInput, ModificarReservaInput } from '../validations/reservas.schema';

export const ReservasService = {
  /**
   * Crear una nueva reserva
   * @param usuario_id - ID del usuario autenticado
   * @param data - Datos de la reserva (horarios)
   */
  async crear(usuario_id: string, data: CrearReservaInput) {
    try {
      const reserva = await ReservasRepo.crearConItems(usuario_id, data.horarios);
      return reserva;
    } catch (error: any) {
      // Propagar el error con mensaje claro
      throw new Error(error.message || 'Error al crear la reserva');
    }
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

    // Verificar que el admin sea dueño del complejo
    const primerItem = reserva.items[0];
    if (!primerItem) {
      const err: any = new Error('Reserva sin horarios');
      err.status = 400;
      throw err;
    }

    const complejo = primerItem.horario.cancha.complejo;
    if (complejo.admin_id !== admin_id) {
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
