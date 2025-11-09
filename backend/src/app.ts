import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import express, { Request, Response, NextFunction } from 'express';
import api from './routes';

const app = express();

app.use(cors());
app.use(helmet());
// Aumentar límite para cuerpos grandes (ej. imágenes base64)
// Subidas base64 de QR pueden exceder 15mb en algunos dispositivos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan("dev"));

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// API v1
app.use('/api/v1', api);

// Handler de errores
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err?.status ?? 500;
  res.status(status).json({ message: err?.message ?? 'Error interno' });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default app;
