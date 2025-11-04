import { http } from "./http";

export type TipoCampo = "SINTETICO" | "TIERRA" | "CESPED";
export type TipoCancha = "FUT5" | "FUT6" | "FUT8" | "FUT11";
export type DiaSemana = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";

export interface RegistrarCanchaPayload {
  nombre: string;
  tipoCampo: TipoCampo;
  tipoCancha: TipoCancha;
  otb?: string;
  subalcaldia?: string;
  celular?: string;
  diasDisponibles?: DiaSemana[];
  precioDiurnoPorHora?: number;
  precioNocturnoPorHora?: number;
  observaciones?: string;
  qrUrl?: string;
  direccion?: string;
  ciudad?: string;
  lat?: number;
  lng?: number;
}

export const CanchasAPI = {
  listar: () => http.get("/canchas/mias").then((r) => r.data),

  obtenerPorId: (id: string) => http.get(`/canchas/${id}/detalle`).then((r) => r.data),

  listarPorComplejo: (complejo_id: string) =>
    http.get(`/canchas/complejo/${complejo_id}`).then((r) => r.data),

  listarIndividuales: (params?: { ciudad?: string; nombre?: string }) =>
    http.get("/canchas/individuales", { params }).then((r) => r.data),

  registrar: (payload: RegistrarCanchaPayload) =>
    http.post("/canchas", payload).then((r) => r.data),

  detalle: (id: string) => http.get(`/canchas/${id}/detalle`).then((r) => r.data),

  disponibilidad: (cancha_id: string, fecha: string) =>
    http.get(`/canchas/disponibilidad/${cancha_id}/${fecha}`).then((r) => r.data),

  actualizar: (id: string, payload: Partial<RegistrarCanchaPayload>) =>
    http.patch(`/canchas/${id}`, payload).then((r) => r.data),

  eliminar: (id: string) => http.delete(`/canchas/${id}`).then((r) => r.data),
};