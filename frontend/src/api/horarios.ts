import { http } from "./http";

export interface CrearHorarioPayload {
  cancha_id: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  precio?: number;
}

export interface CrearHorariosBulkPayload {
  cancha_id: string;
  slots: {
    fecha: string; // YYYY-MM-DD
    hora_inicio: string; // HH:MM:SS
    hora_fin: string; // HH:MM:SS
    disponible?: boolean;
  }[];
}

export const HorariosAPI = {
  crear: (payload: CrearHorarioPayload) =>
    http.post("/horarios", payload).then((r) => r.data),

  crearBulk: (payload: CrearHorariosBulkPayload) =>
    http.post("/horarios/bulk", payload).then((r) => r.data),

  listar: (cancha_id: string, fecha: string) =>
    http.get(`/horarios/cancha/${cancha_id}/${fecha}`).then((r) => r.data),

  actualizar: (id: string, payload: Partial<CrearHorarioPayload>) =>
    http.put(`/horarios/${id}`, payload).then((r) => r.data),

  eliminar: (id: string) => http.delete(`/horarios/${id}`).then((r) => r.data),
};
