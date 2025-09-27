import { Router } from 'express';
import auth from './auth.routes';

const api = Router();
api.use('/auth', auth);

export default api;
