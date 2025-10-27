import { QRsRepo } from '../repositories/qrs.repo';

export const QRsService = {
  /**
   * Subir un nuevo QR
   * @param admin_id - ID del administrador
   * @param imagen_qr - URL o base64 de la imagen
   * @param vigente - Si debe ser el QR activo
   */
  async subirQR(admin_id: string, imagen_qr: string, vigente: boolean = true) {
    // Validaciones básicas
    if (!imagen_qr || imagen_qr.trim() === '') {
      throw new Error('La imagen del QR es requerida');
    }

    return QRsRepo.crear(admin_id, imagen_qr, vigente);
  },

  /**
   * Listar QRs del administrador
   * @param admin_id - ID del administrador
   */
  async listarMisQRs(admin_id: string) {
    return QRsRepo.listarPorAdmin(admin_id);
  },

  /**
   * Obtener el QR vigente del administrador
   * @param admin_id - ID del administrador
   */
  async obtenerQRVigente(admin_id: string) {
    const qr = await QRsRepo.obtenerVigente(admin_id);
    if (!qr) {
      throw new Error('No tienes un QR vigente configurado');
    }
    return qr;
  },

  /**
   * Obtener QR por ID
   * @param id - ID del QR
   * @param admin_id - ID del administrador (para validación)
   */
  async obtenerQRPorId(id: string, admin_id?: string) {
    const qr = await QRsRepo.obtenerPorId(id);
    if (!qr) {
      throw new Error('QR no encontrado');
    }

    // Si se proporciona admin_id, validar que sea el dueño
    if (admin_id && qr.admin_id !== admin_id) {
      throw new Error('No tienes permiso para ver este QR');
    }

    return qr;
  },

  /**
   * Marcar un QR como vigente
   * @param id - ID del QR
   * @param admin_id - ID del administrador
   */
  async activarQR(id: string, admin_id: string) {
    return QRsRepo.marcarComoVigente(id, admin_id);
  },

  /**
   * Desactivar un QR
   * @param id - ID del QR
   * @param admin_id - ID del administrador
   */
  async desactivarQR(id: string, admin_id: string) {
    return QRsRepo.desactivar(id, admin_id);
  },

  /**
   * Eliminar un QR (solo si no tiene pagos)
   * @param id - ID del QR
   * @param admin_id - ID del administrador
   */
  async eliminarQR(id: string, admin_id: string) {
    return QRsRepo.eliminar(id, admin_id);
  },

  /**
   * Obtener el QR vigente del complejo (para mostrarlo al cliente en la reserva)
   * @param complejo_id - ID del complejo
   */
  async obtenerQRPorComplejo(complejo_id: string) {
    const qr = await QRsRepo.obtenerVigentePorComplejo(complejo_id);
    if (!qr) {
      throw new Error(
        'El administrador de este complejo no tiene un QR configurado'
      );
    }
    return qr;
  },
};
