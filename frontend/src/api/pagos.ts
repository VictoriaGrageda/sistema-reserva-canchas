import { http } from "./http";

export const PagosAPI = {
  // Cliente
  obtenerPorReserva: (reserva_id: string) =>
    http.get(`/pagos/reserva/${reserva_id}`).then((r) => r.data),

  obtenerQR: (reserva_id: string) =>
    http.get(`/pagos/reserva/${reserva_id}/qr`).then((r) => r.data),

  marcarRealizado: (reserva_id: string, comprobante: string, qr_id?: string) => {
    console.log("🌐 PagosAPI.marcarRealizado llamado con:", { reserva_id, comprobante: comprobante?.substring(0, 50), qr_id });
    const payload: { comprobante: string; qr_id?: string } = { comprobante };
    if (qr_id) {
      payload.qr_id = qr_id;
    }
    console.log("📦 Payload a enviar:", payload);
    return http.post(`/pagos/reserva/${reserva_id}/marcar-realizado`, payload).then((r) => r.data);
  },

  // Admin
  listar: (queryParams?: { estado?: string; complejo_id?: string }) =>
    http.get("/pagos/admin", { params: queryParams }).then((r) => r.data),

  obtenerDetalle: (id: string) => http.get(`/pagos/${id}`).then((r) => r.data),

  confirmar: (id: string) =>
    http.patch(`/pagos/${id}/confirmar`).then((r) => r.data),

  rechazar: (id: string) =>
    http.patch(`/pagos/${id}/rechazar`).then((r) => r.data),
};