import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

export const QRsRepo = {
  /**
   * Crear un nuevo QR para un administrador
   * @param admin_id - ID del administrador
   * @param imagen_qr - URL o base64 de la imagen del QR
   * @param vigente - Si es el QR activo (default: true)
   */
  async crear(admin_id: string, imagen_qr: string, vigente: boolean = true) {
    return prisma.$transaction(async (tx) => {
      // Si el nuevo QR será vigente, marcar los demás como no vigentes
      if (vigente) {
        await tx.qrs.updateMany({
          where: { admin_id, vigente: true },
          data: { vigente: false },
        });
      }

      // Crear el nuevo QR
      return tx.qrs.create({
        data: {
          admin_id,
          imagen_qr,
          vigente,
        },
      });
    });
  },

  /**
   * Listar todos los QRs de un administrador
   * @param admin_id - ID del administrador
   */
  async listarPorAdmin(admin_id: string) {
    return prisma.qrs.findMany({
      where: { admin_id },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Obtener el QR vigente de un administrador
   * @param admin_id - ID del administrador
   */
  async obtenerVigente(admin_id: string) {
    return prisma.qrs.findFirst({
      where: {
        admin_id,
        vigente: true,
      },
    });
  },

  /**
   * Obtener un QR por ID
   * @param id - ID del QR
   */
  async obtenerPorId(id: string) {
    return prisma.qrs.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            correo: true,
          },
        },
      },
    });
  },

  /**
   * Marcar un QR como vigente (y los demás como no vigentes)
   * @param id - ID del QR a marcar como vigente
   * @param admin_id - ID del administrador (para validación)
   */
  async marcarComoVigente(id: string, admin_id: string) {
    return prisma.$transaction(async (tx) => {
      // Verificar que el QR pertenece al admin
      const qr = await tx.qrs.findUnique({ where: { id } });
      if (!qr || qr.admin_id !== admin_id) {
        throw new Error('QR no encontrado o no autorizado');
      }

      // Marcar todos los QRs del admin como no vigentes
      await tx.qrs.updateMany({
        where: { admin_id, vigente: true },
        data: { vigente: false },
      });

      // Marcar el QR actual como vigente
      return tx.qrs.update({
        where: { id },
        data: { vigente: true },
      });
    });
  },

  /**
   * Desactivar un QR (marcarlo como no vigente)
   * @param id - ID del QR
   * @param admin_id - ID del administrador (para validación)
   */
  async desactivar(id: string, admin_id: string) {
    // Verificar que el QR pertenece al admin
    const qr = await prisma.qrs.findUnique({ where: { id } });
    if (!qr || qr.admin_id !== admin_id) {
      throw new Error('QR no encontrado o no autorizado');
    }

    return prisma.qrs.update({
      where: { id },
      data: { vigente: false },
    });
  },

  /**
   * Eliminar un QR (solo si no tiene pagos asociados)
   * @param id - ID del QR
   * @param admin_id - ID del administrador (para validación)
   */
  async eliminar(id: string, admin_id: string) {
    return prisma.$transaction(async (tx) => {
      // Verificar que el QR pertenece al admin
      const qr = await tx.qrs.findUnique({
        where: { id },
        include: { pagos: true },
      });

      if (!qr || qr.admin_id !== admin_id) {
        throw new Error('QR no encontrado o no autorizado');
      }

      // No permitir eliminar si tiene pagos asociados
      if (qr.pagos.length > 0) {
        throw new Error('No se puede eliminar un QR con pagos asociados');
      }

      return tx.qrs.delete({ where: { id } });
    });
  },

  /**
   * Obtener el QR vigente del administrador de un complejo
   * @param complejo_id - ID del complejo
   */
  async obtenerVigentePorComplejo(complejo_id: string) {
    const complejo = await prisma.complejos.findUnique({
      where: { id: complejo_id },
      include: {
        admin: {
          include: {
            qrs_admin: {
              where: { vigente: true },
              take: 1,
            },
          },
        },
      },
    });

    return complejo?.admin.qrs_admin[0] || null;
  },
};
