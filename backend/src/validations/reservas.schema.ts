import { z } from 'zod';

/**
 * Schema para crear una nueva reserva
 * El cliente envía un array de horarios que desea reservar
 */
export const CrearReservaSchema = z.object({
  horarios: z
    .array(
      z.object({
        horario_id: z.string().uuid('El horario_id debe ser un UUID válido'),
        precio: z.number().positive('El precio debe ser mayor a 0').optional(),
      })
    )
    .min(1, 'Debe seleccionar al menos un horario para reservar'),
});

export type CrearReservaInput = z.infer<typeof CrearReservaSchema>;

/**
 * Schema para modificar una reserva existente
 * Permite cambiar los horarios antes del plazo límite
 */
export const ModificarReservaSchema = z.object({
  horarios: z
    .array(
      z.object({
        horario_id: z.string().uuid('El horario_id debe ser un UUID válido'),
        precio: z.number().positive('El precio debe ser mayor a 0').optional(),
      })
    )
    .min(1, 'Debe seleccionar al menos un horario'),
});

export type ModificarReservaInput = z.infer<typeof ModificarReservaSchema>;

/**
 * Schema para cambiar el estado de una reserva (admin)
 */
export const CambiarEstadoReservaSchema = z.object({
  estado: z.enum(['confirmada', 'cancelada'], {
    message: 'El estado debe ser "confirmada" o "cancelada"',
  }),
});

export type CambiarEstadoInput = z.infer<typeof CambiarEstadoReservaSchema>;

/**
 * Schema para filtros de listado de reservas
 */
export const FiltrosReservasSchema = z.object({
  estado: z.enum(['pendiente', 'confirmada', 'cancelada']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export type FiltrosReservasInput = z.infer<typeof FiltrosReservasSchema>;
