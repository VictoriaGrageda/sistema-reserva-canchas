import { Request, Response, NextFunction } from 'express';
import { UserRepo } from '../repositories/user.repo';

export const me = async (req: Request, res: Response) => {
  const userId = (req as any)?.user?.id ?? (req as any)?.user?.sub;
  if (!userId) return res.status(401).json({ message: 'No autenticado' });

  const u = await UserRepo.findById(String(userId));
  if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });

  const { contrasena, ...safe } = u as any;
  return res.json({ data: safe });
};

export const changeMyRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any)?.user?.id ?? (req as any)?.user?.sub;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const { rol } = req.body as { rol: 'cliente' | 'administrador' };
    if (rol !== 'cliente' && rol !== 'administrador') {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const me = await UserRepo.findById(String(userId));
    if (!me) return res.status(404).json({ message: 'Usuario no encontrado' });

    if ((me as any).rol === rol) return res.status(204).send();

    const updated = await UserRepo.updateRole(String(userId), rol);
    const { contrasena, ...safe } = updated as any;
    return res.status(200).json({ data: safe });
  } catch (err) {
    next(err);
  }
};
