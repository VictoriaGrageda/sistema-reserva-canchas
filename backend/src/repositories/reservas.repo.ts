import { Prisma, PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();

type HorarioItem = {
  horario_id: string;
  precio?: number;
};

export const ReservasRepo = {
  /**
   * Crear una reserva con sus items en una transacción atómica
   * @param usuario_id - ID del usuario que hace la reserva
   * @param horarios - Array de horarios a reservar con sus precios
   * @param opciones - Opciones adicionales (tipo_reserva, recurrencia, etc.)
   * @returns Reserva creada con todos sus datos relacionados
   */
  async crearConItems(
    usuario_id: string,
    horarios: HorarioItem[],
    opciones?: {
      tipo_reserva?: string;
      recurrencia_dia_semana?: string;
      recurrencia_hora?: string;
      extraAfterCreate?: (tx: Prisma.TransactionClient, reservaId: string) => Promise<void>;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar que todos los horarios existan y estén disponibles
      const horariosIds = horarios.map((h) => h.horario_id);
      const horariosDB = await tx.horarios.findMany({
        where: { id: { in: horariosIds } },
        include: { reserva_items: true },
      });

      // Verificar que todos los horarios existan
      if (horariosDB.length !== horarios.length) {
        throw new Error('Uno o más horarios no existen');
      }

      // Verificar que todos estén disponibles
      const noDisponibles = horariosDB.filter((h) => !h.disponible);
      if (noDisponibles.length > 0) {
        throw new Error(
          `Los siguientes horarios no están disponibles: ${noDisponibles.map((h) => h.id).join(', ')}`
        );
      }

      // Verificar que ninguno tenga reserva_items (ya reservado)
      const yaReservados = horariosDB.filter((h) => h.reserva_items.length > 0);
      if (yaReservados.length > 0) {
        throw new Error(
          `Los siguientes horarios ya están reservados: ${yaReservados.map((h) => h.id).join(', ')}`
        );
      }

      // 2. Crear la reserva
      const reserva = await tx.reservas.create({
        data: {
          usuario_id,
          estado: 'pendiente',
          tipo_reserva: (opciones?.tipo_reserva as any) || 'diaria',
          recurrencia_dia_semana: opciones?.recurrencia_dia_semana as any,
          recurrencia_hora: opciones?.recurrencia_hora,
        },
      });

      // 3. Crear los items de la reserva
      const itemsData = horarios.map((h) => ({
        reserva_id: reserva.id,
        horario_id: h.horario_id,
        precio: h.precio,
      }));

      await tx.reserva_items.createMany({
        data: itemsData,
      });

      // 4. Marcar los horarios como NO disponibles
      await tx.horarios.updateMany({
        where: { id: { in: horariosIds } },
        data: { disponible: false },
      });

      // 5. Crear el pago pendiente
      await tx.pagos.create({
        data: {
          reserva_id: reserva.id,
          estado: 'pendiente',
        },
      });

      if (opciones?.extraAfterCreate) {
        await opciones.extraAfterCreate(tx, reserva.id);
      }

      // 6. Retornar la reserva completa
      return tx.reservas.findUnique({
        where: { id: reserva.id },
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
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              correo: true,
            },
          },
          mensualidad: true,
        },
      });
    });
  },

  /**
   * Obtener reservas del usuario con filtros
   * @param usuario_id - ID del usuario
   * @param filters - Filtros opcionales (estado, limit, offset)
   */
  async listarPorUsuario(
    usuario_id: string,
    filters: { estado?: string; limit?: number; offset?: number }
  ) {
    const { estado, limit = 20, offset = 0 } = filters;

    return prisma.reservas.findMany({
      where: {
        usuario_id,
        ...(estado && { estado: estado as any }),
      },
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
        pagos: true,
        mensualidad: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  /**
   * Obtener una reserva por ID con todos sus datos
   */
  async obtenerPorId(id: string) {
    return prisma.reservas.findUnique({
      where: { id },
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
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            correo: true,
            telefono: true,
          },
        },
        mensualidad: true,
      },
    });
  },

  /**
   * Modificar una reserva (cambiar horarios) en transacción
   */
  async modificarHorarios(reserva_id: string, nuevosHorarios: HorarioItem[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Obtener la reserva actual
      const reserva = await tx.reservas.findUnique({
        where: { id: reserva_id },
        include: { items: true },
      });

      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }

      if (reserva.estado !== 'pendiente') {
        throw new Error('Solo se pueden modificar reservas en estado pendiente');
      }

      // 2. Obtener horarios antiguos
      const horariosAntiguosIds = reserva.items.map((item) => item.horario_id);

      // 3. Eliminar items antiguos
      await tx.reserva_items.deleteMany({
        where: { reserva_id },
      });

      // 4. Liberar horarios antiguos
      await tx.horarios.updateMany({
        where: { id: { in: horariosAntiguosIds } },
        data: { disponible: true },
      });

      // 5. Validar nuevos horarios
      const nuevosIds = nuevosHorarios.map((h) => h.horario_id);
      const horariosDB = await tx.horarios.findMany({
        where: { id: { in: nuevosIds } },
        include: { reserva_items: true },
      });

      if (horariosDB.length !== nuevosHorarios.length) {
        throw new Error('Uno o más horarios no existen');
      }

      const noDisponibles = horariosDB.filter((h) => !h.disponible);
      if (noDisponibles.length > 0) {
        throw new Error('Uno o más horarios no están disponibles');
      }

      const yaReservados = horariosDB.filter((h) => h.reserva_items.length > 0);
      if (yaReservados.length > 0) {
        throw new Error('Uno o más horarios ya están reservados');
      }

      // 6. Crear nuevos items
      const itemsData = nuevosHorarios.map((h) => ({
        reserva_id,
        horario_id: h.horario_id,
        precio: h.precio,
      }));

      await tx.reserva_items.createMany({
        data: itemsData,
      });

      // 7. Marcar nuevos horarios como NO disponibles
      await tx.horarios.updateMany({
        where: { id: { in: nuevosIds } },
        data: { disponible: false },
      });

      // 8. Retornar reserva actualizada
      return tx.reservas.findUnique({
        where: { id: reserva_id },
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
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              correo: true,
              telefono: true,
            },
          },
          mensualidad: true,
        },
      });
    });
  },

  /**
   * Cancelar una reserva (libera horarios y cambia estado)
   */
  async cancelar(reserva_id: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Obtener la reserva
      const reserva = await tx.reservas.findUnique({
        where: { id: reserva_id },
        include: { items: true, pagos: true },
      });

      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }

      // 2. Obtener IDs de horarios a liberar
      const horariosIds = reserva.items.map((item) => item.horario_id);

      // 3. Liberar horarios
      await tx.horarios.updateMany({
        where: { id: { in: horariosIds } },
        data: { disponible: true },
      });

      // 4. Cambiar estado de la reserva
      await tx.reservas.update({
        where: { id: reserva_id },
        data: { estado: 'cancelada' },
      });

      // 5. Actualizar estado del pago si existe
      if (reserva.pagos.length > 0) {
        await tx.pagos.updateMany({
          where: { reserva_id },
          data: { estado: 'rechazado' },
        });
      }

      return tx.reservas.findUnique({
        where: { id: reserva_id },
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
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              correo: true,
              telefono: true,
            },
          },
          mensualidad: true,
        },
      });
    });
  },

  /**
   * Cambiar estado de una reserva (admin)
   */
  async cambiarEstado(reserva_id: string, estado: 'confirmada' | 'cancelada') {
    return prisma.$transaction(async (tx) => {
      const reserva = await tx.reservas.update({
        where: { id: reserva_id },
        data: { estado },
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
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              correo: true,
              telefono: true,
            },
          },
          mensualidad: true,
        },
      });

      // Si se cancela, liberar horarios
      if (estado === 'cancelada') {
        const horariosIds = reserva.items.map((item) => item.horario_id);
        await tx.horarios.updateMany({
          where: { id: { in: horariosIds } },
          data: { disponible: true },
        });
      }

      return reserva;
    });
  },

  /**
   * Listar reservas de los complejos del administrador
   * Incluye tanto complejos deportivos como canchas individuales
   */
  async listarPorAdmin(
    admin_id: string,
    filters: { complejo_id?: string; estado?: string; fecha?: string }
  ) {
    const { complejo_id, estado, fecha } = filters;

    return prisma.reservas.findMany({
      where: {
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
              ...(fecha && { fecha: new Date(fecha) }),
            },
          },
        },
        ...(estado && { estado: estado as any }),
      },
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
        pagos: true,
        mensualidad: true,
      },
      orderBy: { created_at: 'desc' },
    });
  },
};
