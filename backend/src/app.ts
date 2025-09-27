import express, { Request, Response, NextFunction } from 'express';
import api from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
