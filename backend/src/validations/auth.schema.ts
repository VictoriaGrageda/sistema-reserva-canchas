import { z } from 'zod';

export const RegisterSchema = z.object({
nombre: z.string().min(2, 'El nombre debe tener mínimo 2 caracteres'),
apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
ci: z.string().min(5, 'El número de CI es obligatorio'),
correo: z.string().email('Correo inválido'),
contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
confirmarContrasena: z.string().min(6, 'Confirmar contraseña es obligatorio'),
telefono: z.string().min(6).max(20).optional(),
foto_perfil: z.string().url('Debe ser una URL válida').optional(),
}).refine(d => d.contrasena === d.confirmarContrasena, {
path: ['confirmarContrasena'],
message: 'Las contraseñas no coinciden',
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
