import { z } from 'zod';

/**
 * Schema para marcar pago como realizado (cliente)
 */
export const MarcarPagoRealizadoSchema = z.object({
  qr_id: z.string().uuid('ID de QR inválido').optional(),

  comprobante: z
    .string({ message: 'El comprobante de pago es requerido' })
    .min(1, 'Debes subir una imagen del comprobante de pago'),
});

export type MarcarPagoRealizadoInput = z.infer<typeof MarcarPagoRealizadoSchema>;

/**
 * Schema para cambiar estado de pago (admin)
 */
export const CambiarEstadoPagoSchema = z.object({
  estado: z.enum(
    ['confirmado', 'rechazado'],
    { message: 'Estado debe ser "confirmado" o "rechazado"' }
  ),
});


export type CambiarEstadoPagoInput = z.infer<typeof CambiarEstadoPagoSchema>;

/**
 * Schema para filtros de listado de pagos
 */
export const FiltrosPagosSchema = z.object({
  estado: z.enum(['pendiente', 'confirmado', 'rechazado']).optional(),
  complejo_id: z.string().uuid('ID de complejo inválido').optional(),
});

export type FiltrosPagosInput = z.infer<typeof FiltrosPagosSchema>;
