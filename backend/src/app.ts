import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express, { Request, Response, NextFunction } from 'express';
import api from './routes';

const app = express();

// ----- CORS (ajusta el dominio del frontend cuando lo tengas) -----
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN,          // ej: https://mi-frontend.onrender.com
  'http://localhost:5173',              // Vite local
].filter(Boolean) as string[];

app.use(cors({
  origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true, // mientras tanto, true
  credentials: true,
}));

app.use(helmet());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// --------- Raíz y health ----------
app.get('/', (_req: Request, res: Response) => {
  res.send('✅ API OK');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// --------- API v1 ----------
app.use('/api/v1', api);

// --------- Manejo de errores ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status ?? 500;
  res.status(status).json({ message: err?.message ?? 'Error interno' });
});

export default app;
