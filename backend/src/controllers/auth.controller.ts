import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';


export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await AuthService.register(req.body);
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};
export const login = async (req: any, res: any, next: any) => {
  try {
    const data = await AuthService.login(req.body);
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};
