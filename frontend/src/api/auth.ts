import { http } from "./http";

export type LoginPayload = { correo: string; contrasena: string };
export type RegisterPayload = {
  nombre: string;
  apellidos: string;
  ci: string;
  correo: string;
  telefono?: string;
  contrasena: string;
  confirmarContrasena: string;
};

export type LoginData = {
  user: {
    id: number | string;
    nombre: string;
    apellidos: string;
    correo: string;
    rol: string;
    ci?: string;
    telefono?: string;
    foto_perfil?: string;
  };
  token: string;
  expiresIn?: number;
};

export const AuthAPI = {
  login: (payload: LoginPayload) =>
    http.post<{ data: LoginData }>("/auth/login", payload).then((r) => r.data.data),

  register: (payload: RegisterPayload) =>
    http.post<{ data: any }>("/auth/register", payload).then((r) => r.data.data),
};
