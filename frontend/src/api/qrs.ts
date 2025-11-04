import { http } from "./http";

export type SubirQRPayload = {
  imagen_qr: string;
  vigente: boolean;
};

export const QRsAPI = {
  crear: (imagen_qr: string, vigente: boolean = true) =>
    http.post("/qrs", { imagen_qr, vigente }).then((r) => r.data),

  subir: (payload: SubirQRPayload) =>
    http.post("/qrs", payload).then((r) => r.data),

  listar: () =>
    http.get("/qrs/mis-qrs").then((r) => r.data),

  listarMisQRs: () =>
    http.get("/qrs/mis-qrs").then((r) => r.data),

  activar: (id: string) =>
    http.patch(`/qrs/${id}/activar`).then((r) => r.data),

  desactivar: (id: string) =>
    http.patch(`/qrs/${id}/desactivar`).then((r) => r.data),
};