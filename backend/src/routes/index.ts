import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const api = Router();
api.use('/auth', authRoutes);   // => /api/v1/auth/register
api.use('/usuarios', userRoutes); 
export default api;
