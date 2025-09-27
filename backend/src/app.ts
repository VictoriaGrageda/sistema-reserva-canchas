import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Bienvenido al backend del sistema de reserva de canchas" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default app;
