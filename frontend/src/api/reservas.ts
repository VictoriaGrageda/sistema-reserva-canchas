import { http } from "./http";

export type CrearReservaPayload = {
  horarios: { horario_id: string; precio: number }[];
};

export const ReservasAPI = {
  crear: (payload: CrearReservaPayload) =>
    http.post("/reservas", payload).then((r) => r.data),

  listarMisReservas: () =>
    http.get("/reservas/mis-reservas").then((r) => r.data),

  obtenerDetalle: (id: string) =>
    http.get(`/reservas/${id}`).then((r) => r.data),

  modificar: (id: string, payload: CrearReservaPayload) =>
    http.patch(`/reservas/${id}`, payload).then((r) => r.data),

  cancelar: (id: string) =>
    http.delete(`/reservas/${id}`).then((r) => r.data),
};