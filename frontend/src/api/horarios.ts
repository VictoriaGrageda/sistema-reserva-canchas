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

export interface ConfiguracionHorarioPayload {
  dia_semana: string; // "LUNES", "MARTES", etc.
  hora_inicio: string; // "06:00"
  hora_fin: string; // "23:00"
}

export interface GenerarBloquesPayload {
  cancha_id: string;
  configuraciones: ConfiguracionHorarioPayload[];
  diasAGenerar?: number;
  horaCorte?: string;
}

export interface CambiarDisponibilidadPayload {
  cancha_id: string;
  fecha_desde: string; // YYYY-MM-DD
  fecha_hasta: string; // YYYY-MM-DD
  disponible: boolean;
  hora_inicio?: string;
  hora_fin?: string;
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

  // 🆕 Nuevas funciones
  generarBloques: (payload: GenerarBloquesPayload) =>
    http.post("/horarios/generar-bloques", payload).then((r) => r.data),

  guardarConfiguraciones: (cancha_id: string, configuraciones: ConfiguracionHorarioPayload[]) =>
    http.post(`/horarios/configuraciones/${cancha_id}`, { configuraciones }).then((r) => r.data),

  obtenerConfiguraciones: (cancha_id: string) =>
    http.get(`/horarios/configuraciones/${cancha_id}`).then((r) => r.data),

  cambiarDisponibilidad: (payload: CambiarDisponibilidadPayload) =>
    http.patch("/horarios/disponibilidad", payload).then((r) => r.data),
};
