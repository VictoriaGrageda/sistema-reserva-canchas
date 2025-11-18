/**
 * Utilidades para manejo de fechas
 * Soluciona problemas de zona horaria y formateo consistente
 */

/**
 * Crea una fecha en hora local a partir de un string YYYY-MM-DD
 * Evita problemas de zona horaria que causan cambios de día
 */
export const parseFechaLocal = (fechaStr: string): Date => {
  const soloFecha = fechaStr.split("T")[0];
  const parts = soloFecha.split("-").map(Number);
  if (parts.length === 3 && parts.every((num) => !Number.isNaN(num))) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(fechaStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

/**
 * Obtiene el nombre del día de la semana en español
 * @param fecha - String YYYY-MM-DD o Date
 * @returns Nombre completo del día (ej: "lunes", "martes")
 */
export const getDiaSemana = (fecha: string | Date): string => {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const d = typeof fecha === 'string' ? parseFechaLocal(fecha) : fecha;
  return dias[d.getDay()];
};

/**
 * Obtiene el nombre del día de la semana en formato enum del backend
 * @param fecha - String YYYY-MM-DD o Date
 * @returns Nombre en mayúsculas (ej: "LUNES", "MARTES")
 */
export const getDiaSemanaEnum = (fecha: string | Date): string => {
  const dias = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
  const d = typeof fecha === 'string' ? parseFechaLocal(fecha) : fecha;
  return dias[d.getDay()];
};

/**
 * Formatea una fecha en español con día de la semana
 * @param fecha - String YYYY-MM-DD o Date
 * @returns String formateado (ej: "lunes, 15 de enero de 2025")
 */
export const formatearFechaCompleta = (fecha: string | Date): string => {
  const d = typeof fecha === 'string' ? parseFechaLocal(fecha) : fecha;
  const diaSemana = getDiaSemana(d);
  const dia = d.getDate();
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const mes = meses[d.getMonth()];
  const año = d.getFullYear();

  return `${diaSemana}, ${dia} de ${mes} de ${año}`;
};

/**
 * Formatea una fecha en formato corto
 * @param fecha - String YYYY-MM-DD o Date
 * @returns String formateado (ej: "lun 15 ene")
 */
export const formatearFechaCorta = (fecha: string | Date): string => {
  const d = typeof fecha === 'string' ? parseFechaLocal(fecha) : fecha;
  const diasCortos = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const mesesCortos = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
  ];

  const diaSemana = diasCortos[d.getDay()];
  const dia = d.getDate();
  const mes = mesesCortos[d.getMonth()];

  return `${diaSemana} ${dia} ${mes}`;
};
const parseDateValue = (value?: string | Date): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatearFechaLegible = (value?: string | Date): string => {
  const date = parseDateValue(value);
  if (!date) return "-";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatearHoraLegible = (value?: string | Date): string => {
  if (!value) return "--:--";
  if (value instanceof Date) {
    return value.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const text = String(value);
  if (text.includes("T")) {
    const timePart = text.substring(text.indexOf("T") + 1, text.indexOf("T") + 6);
    if (/^\d{2}:\d{2}$/.test(timePart)) return timePart;
  }
  if (text.includes(":")) {
    const [hour = "--", minute = "00"] = text.split(":");
    return `${hour.padStart(2, "0")}:${minute.slice(0, 2).padStart(2, "0")}`;
  }
  const date = parseDateValue(text);
  if (date) {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "--:--";
};
