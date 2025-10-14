import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const zerr = parsed.error as ZodError;
      return res.status(422).json({ errors: zerr.flatten() });
    }
    req.body = parsed.data;
    next();
  };
