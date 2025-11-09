import { http } from "./http";

export type TipoReserva = "diaria" | "mensual" | "recurrente";

export type CrearReservaPayload = {
  horarios: { horario_id: string; precio: number }[];
  tipo_reserva?: TipoReserva;
  recurrencia_dia_semana?: string;
  recurrencia_hora?: string;
};

export type CrearReservaMensualPayload = {
  cancha_id: string;
  dia_semana?: string; // "LUNES", "MARTES", etc. (legacy)
  dias_semana?: string[]; // Nuevo: múltiples días de la semana
  hora_inicio: string; // "20:00"
  hora_fin: string; // "21:00"
  precio?: number;
  rangos?: Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }>; // Nuevo: por día
};

export type CrearReservaRecurrentePayload = {
  cancha_id: string;
  dia_semana: string; // "LUNES", "MARTES", etc.
  hora_inicio: string; // "20:00"
  hora_fin: string; // "21:00"
  precio?: number;
};

export const ReservasAPI = {
  crear: (payload: CrearReservaPayload) =>
    http.post("/reservas", payload).then((r) => r.data),

  crearMensual: (payload: CrearReservaMensualPayload) =>
    http.post("/reservas/mensual", payload).then((r) => r.data),

  previewMensual: (payload: CrearReservaMensualPayload) =>
    http.post("/reservas/mensual/preview", payload).then((r) => r.data),

  crearRecurrente: (payload: CrearReservaRecurrentePayload) =>
    http.post("/reservas/recurrente", payload).then((r) => r.data),

  listarMisReservas: () =>
    http.get("/reservas/mis-reservas").then((r) => r.data),

  obtenerDetalle: (id: string) =>
    http.get(`/reservas/${id}`).then((r) => r.data),

  modificar: (id: string, payload: CrearReservaPayload) =>
    http.patch(`/reservas/${id}`, payload).then((r) => r.data),

  cancelar: (id: string) =>
    http.delete(`/reservas/${id}`).then((r) => r.data),
};
