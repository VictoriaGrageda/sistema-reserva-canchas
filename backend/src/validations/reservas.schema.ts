import { z } from 'zod';

export const CrearReservaItemSchema = z.object({
  canchaId: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha YYYY-MM-DD'),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, 'hora HH:MM'),
  fin: z.string().regex(/^\d{2}:\d{2}$/, 'hora HH:MM'),
});

export const CrearReservaSchema = z.object({
  items: z.array(CrearReservaItemSchema).min(1, 'Debe incluir al menos 1 item'),
  metodoPago: z.enum(['qr']).optional(), // por tu Figma; puedes ampliar luego
});

export type CrearReservaDTO = z.infer<typeof CrearReservaSchema>;
