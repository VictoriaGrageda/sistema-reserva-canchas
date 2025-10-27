import { PagosRepo } from '../repositories/pagos.repo';
import { QRsRepo } from '../repositories/qrs.repo';

export const PagosService = {
  /**
   * Obtener el pago de una reserva con el QR del complejo
   * @param reserva_id - ID de la reserva
   * @param usuario_id - ID del usuario (para validación)
   */
  async obtenerPagoDeReserva(reserva_id: string, usuario_id?: string) {
    const pago = await PagosRepo.obtenerPorReserva(reserva_id);

    if (!pago) {
      throw new Error('No se encontró el pago de esta reserva');
    }

    // Validar que el usuario sea el dueño de la reserva
    if (usuario_id && pago.reserva.usuario_id !== usuario_id) {
      throw new Error('No tienes permiso para ver este pago');
    }

    return pago;
  },

  /**
   * Obtener información del QR para realizar el pago de una reserva
   * @param reserva_id - ID de la reserva
   */
  async obtenerQRParaPago(reserva_id: string) {
    const pago = await PagosRepo.obtenerPorReserva(reserva_id);

    if (!pago) {
      throw new Error('No se encontró el pago de esta reserva');
    }

    // Obtener el complejo de la reserva
    const primerItem = pago.reserva.items[0];
    if (!primerItem) {
      throw new Error('La reserva no tiene items');
    }

    const complejo_id = primerItem.horario.cancha.complejo_id;

    // Obtener el QR vigente del administrador del complejo
    const qr = await QRsRepo.obtenerVigentePorComplejo(complejo_id);

    if (!qr) {
      throw new Error('El complejo no tiene un QR de pago configurado');
    }

    return {
      pago,
      qr,
    };
  },

  /**
   * Cliente marca que realizó el pago
   * @param reserva_id - ID de la reserva
   * @param usuario_id - ID del usuario (para validación)
   * @param qr_id - ID del QR al que pagó (opcional)
   */
  async marcarPagoRealizado(
    reserva_id: string,
    usuario_id: string,
    qr_id?: string
  ) {
    // Validar que el usuario sea el dueño de la reserva
    const pago = await PagosRepo.obtenerPorReserva(reserva_id);

    if (!pago) {
      throw new Error('No se encontró el pago de esta reserva');
    }

    if (pago.reserva.usuario_id !== usuario_id) {
      throw new Error('No tienes permiso para modificar este pago');
    }

    return PagosRepo.marcarComoRealizado(reserva_id, qr_id);
  },

  /**
   * Administrador confirma el pago
   * @param pago_id - ID del pago
   * @param admin_id - ID del administrador (para validación)
   */
  async confirmarPago(pago_id: string, admin_id: string) {
    // Obtener el pago con toda la info
    const pago = await PagosRepo.obtenerPorId(pago_id);

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    // Validar que el admin sea dueño del complejo de la reserva
    const primerItem = pago.reserva.items[0];
    if (!primerItem) {
      throw new Error('La reserva no tiene items');
    }

    const complejo = primerItem.horario.cancha.complejo;
    if (complejo.admin_id !== admin_id) {
      throw new Error('No tienes permiso para confirmar este pago');
    }

    // Validar que el pago esté pendiente
    if (pago.estado !== 'pendiente') {
      throw new Error(
        `El pago ya fue ${pago.estado === 'confirmado' ? 'confirmado' : 'rechazado'}`
      );
    }

    return PagosRepo.confirmar(pago_id);
  },

  /**
   * Administrador rechaza el pago
   * @param pago_id - ID del pago
   * @param admin_id - ID del administrador (para validación)
   */
  async rechazarPago(pago_id: string, admin_id: string) {
    // Obtener el pago con toda la info
    const pago = await PagosRepo.obtenerPorId(pago_id);

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    // Validar que el admin sea dueño del complejo de la reserva
    const primerItem = pago.reserva.items[0];
    if (!primerItem) {
      throw new Error('La reserva no tiene items');
    }

    const complejo = primerItem.horario.cancha.complejo;
    if (complejo.admin_id !== admin_id) {
      throw new Error('No tienes permiso para rechazar este pago');
    }

    // Validar que el pago esté pendiente
    if (pago.estado !== 'pendiente') {
      throw new Error(
        `El pago ya fue ${pago.estado === 'confirmado' ? 'confirmado' : 'rechazado'}`
      );
    }

    return PagosRepo.rechazar(pago_id);
  },

  /**
   * Listar pagos del administrador
   * @param admin_id - ID del administrador
   * @param filters - Filtros opcionales
   */
  async listarPagosPorAdmin(
    admin_id: string,
    filters: { estado?: string; complejo_id?: string }
  ) {
    return PagosRepo.listarPorAdmin(admin_id, filters);
  },

  /**
   * Listar pagos pendientes del administrador
   * @param admin_id - ID del administrador
   */
  async listarPagosPendientes(admin_id: string) {
    return PagosRepo.listarPendientesPorAdmin(admin_id);
  },

  /**
   * Obtener detalle de un pago
   * @param pago_id - ID del pago
   * @param admin_id - ID del administrador (para validación, opcional)
   */
  async obtenerDetallePago(pago_id: string, admin_id?: string) {
    const pago = await PagosRepo.obtenerPorId(pago_id);

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    // Si se proporciona admin_id, validar permisos
    if (admin_id) {
      const primerItem = pago.reserva.items[0];
      if (!primerItem) {
        throw new Error('La reserva no tiene items');
      }

      const complejo = primerItem.horario.cancha.complejo;
      if (complejo.admin_id !== admin_id) {
        throw new Error('No tienes permiso para ver este pago');
      }
    }

    return pago;
  },

  /**
   * Cambiar estado de un pago (admin)
   * @param pago_id - ID del pago
   * @param estado - Nuevo estado
   * @param admin_id - ID del administrador
   */
  async cambiarEstadoPago(
    pago_id: string,
    estado: 'confirmado' | 'rechazado',
    admin_id: string
  ) {
    if (estado === 'confirmado') {
      return this.confirmarPago(pago_id, admin_id);
    } else {
      return this.rechazarPago(pago_id, admin_id);
    }
  },
};
