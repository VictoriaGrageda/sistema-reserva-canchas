import { Router } from 'express';
import authRoutes from './auth.routes';

const api = Router();
api.use('/auth', authRoutes);   // => /api/v1/auth/register

export default api;
