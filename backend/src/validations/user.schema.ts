import { z } from 'zod';

/** Validación para el cambio de rol por el propio usuario */
export const SelfChangeRoleSchema = z.object({
  rol: z.enum(['cliente', 'administrador'])
});

export type SelfChangeRoleInput = z.infer<typeof SelfChangeRoleSchema>;
