import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client'; 
const prisma = new PrismaClient();

export const PagosRepo = {
  /**
   * Crear un pago para una reserva
   * @param reserva_id - ID de la reserva
   * @param qr_id - ID del QR usado (opcional)
   */
  async crear(reserva_id: string, qr_id?: string) {
    return prisma.pagos.create({
      data: {
        reserva_id,
        qr_id,
        estado: 'pendiente',
      },
      include: {
        qr: true,
        reserva: {
          include: {
            items: true,
          },
        },
      },
    });
  },

  /**
   * Obtener un pago por ID
   * @param id - ID del pago
   */
  async obtenerPorId(id: string) {
    return prisma.pagos.findUnique({
      where: { id },
      include: {
        qr: true,
        reserva: {
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
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
                correo: true,
                telefono: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Obtener el pago de una reserva
   * @param reserva_id - ID de la reserva
   */
  async obtenerPorReserva(reserva_id: string) {
    return prisma.pagos.findFirst({
      where: { reserva_id },
      include: {
        qr: true,
        reserva: {
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
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Cliente marca que realizó el pago
   * @param reserva_id - ID de la reserva
   * @param comprobante - Imagen/URL del comprobante de pago
   * @param qr_id - ID del QR al que pagó (opcional)
   */
  async marcarComoRealizado(reserva_id: string, comprobante: string, qr_id?: string) {
    console.log('📝 Marcando pago como realizado para reserva:', reserva_id);
    console.log('📏 Tamaño del comprobante:', comprobante?.length || 0, 'caracteres');
    console.log('🔍 Tipo de comprobante:', comprobante?.substring(0, 30) + '...');

    // Buscar el pago de la reserva
    const pago = await prisma.pagos.findFirst({
      where: { reserva_id },
      orderBy: { created_at: 'desc' },
    });

    if (!pago) {
      throw new Error('No se encontró el pago de esta reserva');
    }

    // Solo se puede marcar como realizado si está pendiente
    if (pago.estado !== 'pendiente') {
      throw new Error(
        `El pago ya fue ${pago.estado === 'confirmado' ? 'confirmado' : 'rechazado'}`
      );
    }

    // Actualizar el pago (aún queda pendiente hasta que el admin confirme)
    const pagoActualizado = await prisma.pagos.update({
      where: { id: pago.id },
      data: {
        qr_id: qr_id || pago.qr_id, // actualizar el QR si se proporciona
        comprobante: comprobante, // guardar el comprobante de pago
        // El estado sigue siendo "pendiente" hasta que el admin confirme
      },
      include: {
        qr: true,
        reserva: true,
      },
    });

    console.log('✅ Pago actualizado con comprobante');
    return pagoActualizado;
  },

  /**
   * Administrador confirma el pago
   * @param pago_id - ID del pago
   */
  async confirmar(pago_id: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Actualizar el pago
      const pago = await tx.pagos.update({
        where: { id: pago_id },
        data: {
          estado: 'confirmado',
          fecha_pago: new Date(),
        },
        include: {
          reserva: {
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
            },
          },
        },
      });

      // Cambiar estado de la reserva a "confirmada"
      await tx.reservas.update({
        where: { id: pago.reserva_id },
        data: { estado: 'confirmada' },
      });

      return pago;
    });
  },

  /**
   * Administrador rechaza el pago
   * @param pago_id - ID del pago
   */
  async rechazar(pago_id: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Actualizar el pago
      const pago = await tx.pagos.update({
        where: { id: pago_id },
        data: {
          estado: 'rechazado',
        },
        include: {
          reserva: {
            include: {
              items: {
                include: {
                  horario: true,
                },
              },
            },
          },
        },
      });

      // Cambiar estado de la reserva a "cancelada"
      await tx.reservas.update({
        where: { id: pago.reserva_id },
        data: { estado: 'cancelada' },
      });

      // Liberar los horarios
      const horariosIds = pago.reserva.items.map((item: { horario_id: string }) => item.horario_id     );
      await tx.horarios.updateMany({
        where: { id: { in: horariosIds } },
        data: { disponible: true },
      }); 

      return pago;
    });
  },

  /**
   * Listar pagos de un administrador (de todas sus reservas)
   * @param admin_id - ID del administrador
   * @param filters - Filtros opcionales
   */
  /**
   * Listar pagos del administrador
   * Incluye tanto complejos deportivos como canchas individuales
   */
  async listarPorAdmin(
    admin_id: string,
    filters: { estado?: string; complejo_id?: string }
  ) {
    const { estado, complejo_id } = filters;

    return prisma.pagos.findMany({
      where: {
        reserva: {
          items: {
            some: {
              horario: {
                cancha: {
                  OR: [
                    // Canchas de complejos del admin
                    {
                      complejo: {
                        admin_id,
                        ...(complejo_id && { id: complejo_id }),
                      },
                    },
                    // Canchas individuales del admin
                    {
                      admin_id,
                      complejo_id: null,
                    },
                  ],
                },
              },
            },
          },
        },
        ...(estado && { estado: estado as any }),
      },
      include: {
        qr: true,
        reserva: {
          include: {
            items: {
              include: {
                horario: {
                  include: {
                    cancha: {
                      include: {
                        complejo: {
                          select: {
                            id: true,
                            nombre: true,
                            ciudad: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
                correo: true,
                telefono: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Listar pagos pendientes de confirmación (para admin)
   * @param admin_id - ID del administrador
   */
  async listarPendientesPorAdmin(admin_id: string) {
    return this.listarPorAdmin(admin_id, { estado: 'pendiente' });
  },

  /**
   * Cambiar estado de un pago (genérico)
   * @param pago_id - ID del pago
   * @param estado - Nuevo estado
   */
  async cambiarEstado(pago_id: string, estado: 'confirmado' | 'rechazado') {
    if (estado === 'confirmado') {
      return this.confirmar(pago_id);
    } else {
      return this.rechazar(pago_id);
    }
  },
};
