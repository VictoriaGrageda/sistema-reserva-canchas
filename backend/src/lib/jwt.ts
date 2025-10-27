// src/lib/jwt.ts
import * as jwt from "jsonwebtoken"; // <-- IMPORTA ASÍ (clave para TS)

// Lee variables del .env
const SECRET: jwt.Secret =
  (process.env.JWT_SECRET as string) ?? "dev-secret-change-me";

// "1d", "12h" o un número en segundos
const EXPIRES_IN: jwt.SignOptions["expiresIn"] =
  ((process.env.JWT_EXPIRES_IN as string) ?? "1d") as jwt.SignOptions["expiresIn"];

// Tus roles actuales en Prisma: "cliente" | "administrador"
export type JwtPayload = {
  id: string;
  correo: string;
  rol: "cliente" | "administrador" | 'pendiente';
};

// Firma el token que se devolverá en el login
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as object, SECRET, { expiresIn: EXPIRES_IN });
};

// Verifica un token (lo usaremos después en /me o rutas privadas)
export const verifyToken = <T = JwtPayload>(token: string): T => {
  return jwt.verify(token, SECRET) as T;
};
