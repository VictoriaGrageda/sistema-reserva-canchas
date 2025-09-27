import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
register: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await AuthService.register(req.body);
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
    },
};
