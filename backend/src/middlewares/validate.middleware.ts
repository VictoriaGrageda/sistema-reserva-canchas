import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Usa Zod para validar el body. Si valida, sustituye req.body por los datos parseados.
 */
export const validate = (schema: ZodSchema<any>) => {
  if (!schema) {
    throw new Error('validate(): schema es undefined (revisa tu import/export)');
  }

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const issues = result.error.issues?.map(i => ({
          path: i.path.join('.'),
          message: i.message
        }));
        return res.status(400).json({ message: 'Validación fallida', issues });
      }
      req.body = result.data;
      next();
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Error en validate' });
    }
  };
};
