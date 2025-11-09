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

/**
 * Schema para crear reserva mensual (admite uno o múltiples días de semana)
 */
const DiaSemanaZod = z.enum([
  'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO',
]);

const HoraHHMM = z
  .string()
  .regex(/^\d{2}:\d{2}$/i, 'Hora inválida. Formato HH:MM');

const RangoMensual = z.object({
  dia_semana: DiaSemanaZod,
  hora_inicio: HoraHHMM,
  hora_fin: HoraHHMM,
});

export const CrearReservaMensualSchema = z
  .object({
    cancha_id: z.string().uuid('cancha_id inválido'),
    // Modo 1: un solo rango para uno o varios días
    hora_inicio: HoraHHMM.optional(),
    hora_fin: HoraHHMM.optional(),
    dias_semana: z.array(DiaSemanaZod).min(1, 'Elija al menos un día').optional(),
    dia_semana: DiaSemanaZod.optional(),
    // Modo 2: múltiples rangos específicos (día + horas por fila)
    rangos: z.array(RangoMensual).min(1, 'Agregue al menos un rango').optional(),
    precio: z.number().positive().optional(),
  })
  .refine((d) => {
    const modo2 = Array.isArray(d.rangos) && d.rangos.length > 0;
    const modo1 = (!!d.dia_semana || (Array.isArray(d.dias_semana) && d.dias_semana.length > 0)) && !!d.hora_inicio && !!d.hora_fin;
    return modo1 || modo2;
  }, {
    message: 'Debe enviar "rangos" o bien (dia(s)_semana + hora_inicio + hora_fin)'
  })
  .refine((d) => {
    const modo2 = Array.isArray(d.rangos) && d.rangos.length > 0;
    const modo1 = (!!d.dia_semana || (Array.isArray(d.dias_semana) && d.dias_semana.length > 0)) && !!d.hora_inicio && !!d.hora_fin;
    // No permitir ambos modos simultáneamente
    return !(modo1 && modo2);
  }, {
    message: 'No combine rangos con dia(s)_semana + horas. Use un solo modo.'
  });

export type CrearReservaMensualInput = z.infer<typeof CrearReservaMensualSchema>;

/**
 * Schema para crear reserva recurrente (un solo día)
 */
export const CrearReservaRecurrenteSchema = z.object({
  cancha_id: z.string().uuid('cancha_id inválido'),
  dia_semana: DiaSemanaZod,
  hora_inicio: HoraHHMM,
  hora_fin: HoraHHMM,
  precio: z.number().positive().optional(),
});

export type CrearReservaRecurrenteInput = z.infer<typeof CrearReservaRecurrenteSchema>;
