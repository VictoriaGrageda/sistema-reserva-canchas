import { z } from 'zod';

export const RegisterSchema = z.object({
nombre: z.string().min(2, 'Nombre demasiado corto'),
correo: z.string().email('Correo inválido'),
contrasena: z.string().min(6, 'Mínimo 6 caracteres'),
telefono: z.string().min(6).max(20).optional(),
rol: z.enum(['cliente', 'administrador']).default('cliente'),
foto_perfil: z.string().url().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;
