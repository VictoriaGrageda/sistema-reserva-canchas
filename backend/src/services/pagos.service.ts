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
   * Soporta tanto canchas de complejos como canchas individuales
   * @param reserva_id - ID de la reserva
   */
  async obtenerQRParaPago(reserva_id: string) {
    console.log('🔍 Obteniendo QR para pago de reserva:', reserva_id);

    const pago = await PagosRepo.obtenerPorReserva(reserva_id);

    if (!pago) {
      throw new Error('No se encontró el pago de esta reserva');
    }

    // Obtener la cancha de la reserva
    const primerItem = pago.reserva.items[0];
    if (!primerItem) {
      throw new Error('La reserva no tiene items');
    }

    const cancha_id = primerItem.horario.cancha_id;
    console.log('📍 Buscando QR para cancha_id:', cancha_id);

    // Obtener el QR vigente del administrador (funciona para complejo o cancha individual)
    const qr = await QRsRepo.obtenerVigentePorCancha(cancha_id);

    if (!qr) {
      console.error('❌ No se encontró QR para cancha:', cancha_id);
      throw new Error('No hay un QR de pago configurado para esta cancha');
    }

    console.log('✅ QR encontrado:', { id: qr.id, vigente: qr.vigente });

    return {
      pago,
      qr,
    };
  },

  /**
   * Cliente marca que realizó el pago
   * @param reserva_id - ID de la reserva
   * @param usuario_id - ID del usuario (para validación)
   * @param comprobante - Imagen/URL del comprobante de pago
   * @param qr_id - ID del QR al que pagó (opcional)
   */
  async marcarPagoRealizado(
    reserva_id: string,
    usuario_id: string,
    comprobante: string,
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

    return PagosRepo.marcarComoRealizado(reserva_id, comprobante, qr_id);
  },

  /**
   * Administrador confirma el pago
   * Soporta tanto canchas de complejos como canchas individuales
   * @param pago_id - ID del pago
   * @param admin_id - ID del administrador (para validación)
   */
  async confirmarPago(pago_id: string, admin_id: string) {
    // Obtener el pago con toda la info
    const pago = await PagosRepo.obtenerPorId(pago_id);

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    // Validar que el admin sea dueño de la cancha (complejo o individual)
    const primerItem = pago.reserva.items[0];
    if (!primerItem) {
      throw new Error('La reserva no tiene items');
    }

    const cancha = primerItem.horario.cancha;
    const adminDueno = cancha.complejo?.admin_id || cancha.admin_id;

    if (adminDueno !== admin_id) {
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
   * Soporta tanto canchas de complejos como canchas individuales
   * @param pago_id - ID del pago
   * @param admin_id - ID del administrador (para validación)
   */
  async rechazarPago(pago_id: string, admin_id: string) {
    // Obtener el pago con toda la info
    const pago = await PagosRepo.obtenerPorId(pago_id);

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    // Validar que el admin sea dueño de la cancha (complejo o individual)
    const primerItem = pago.reserva.items[0];
    if (!primerItem) {
      throw new Error('La reserva no tiene items');
    }

    const cancha = primerItem.horario.cancha;
    const adminDueno = cancha.complejo?.admin_id || cancha.admin_id;

    if (adminDueno !== admin_id) {
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
   * Soporta tanto canchas de complejos como canchas individuales
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

      const cancha = primerItem.horario.cancha;
      const adminDueno = cancha.complejo?.admin_id || cancha.admin_id;

      if (adminDueno !== admin_id) {
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
