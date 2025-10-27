import { z } from 'zod';

/**
 * Schema para subir un nuevo QR
 */
export const SubirQRSchema = z.object({
  imagen_qr: z
    .string()
    .min(1, 'La imagen del QR es requerida')
    .refine(
      (val) => {
        // Validar que sea una URL válida o base64
        try {
          new URL(val);
          return true;
        } catch {
          // Si no es URL, validar que sea base64
          return /^data:image\/(png|jpg|jpeg|webp);base64,/.test(val) || val.length > 20;
        }
      },
      { message: 'Debe ser una URL válida o imagen en base64' }
    ),
  vigente: z.boolean().optional().default(true),
});

export type SubirQRInput = z.infer<typeof SubirQRSchema>;

/**
 * Schema para activar/desactivar QR
 */
export const ActivarQRSchema = z.object({
  vigente: z.boolean(),
});

export type ActivarQRInput = z.infer<typeof ActivarQRSchema>;
