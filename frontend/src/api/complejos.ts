import { http } from "./http";

export interface RegistrarComplejoPayload {
  nombre: string;
  otb: string;
  subalcaldia: string;
  celular: string;
  telefono?: string;
  diasDisponibles: string[];
  precioDiurnoPorHora: number;
  precioNocturnoPorHora: number;
  direccion?: string;
  ciudad?: string;
  lat?: number;
  lng?: number;
  observaciones?: string;
  qrUrl?: string;
  logotipo?: string;
  admin_id: string;
  canchas?: {
    nombre: string;
    tipoCancha: string;
    tipoCampo: string;
  }[];
}

export interface BuscarComplejosParams {
  ciudad?: string;
  nombre?: string;
}

export const ComplejosAPI = {
  registrar: (payload: RegistrarComplejoPayload) =>
    http.post("/complejos", payload).then((r) => r.data),

  buscar: (params?: BuscarComplejosParams) =>
    http.get("/complejos", { params }).then((r) => r.data),

  obtener: (id: string) => http.get(`/complejos/${id}`).then((r) => r.data),

  listarPorAdmin: (admin_id: string) =>
    http.get(`/complejos/admin/${admin_id}`).then((r) => r.data),

  actualizar: (id: string, payload: Partial<RegistrarComplejoPayload>) =>
    http.patch(`/complejos/${id}`, payload).then((r) => r.data),
};