export type FieldErrors = Record<string, string[]>;

export function parseApiError(e: any): {
  status?: number;
  message: string;
  fieldErrors?: FieldErrors;
} {
  // Error de red (no llegó respuesta)
  if (!e?.response) {
    return {
      message:
        "Sin conexión con el servidor. Verifica tu Wi-Fi/IP y vuelve a intentar.",
    };
  }

  const status = e.response.status as number;
  const data = e.response.data ?? {};

  // Zod (422) con fieldErrors
  const zodFieldErrors: FieldErrors | undefined = data?.errors?.fieldErrors;

  // Mensaje general del backend si existe
  const generic =
    (typeof data?.message === "string" && data.message) ||
    (zodFieldErrors && "Hay campos con errores") ||
    "Ocurrió un error. Intenta de nuevo.";

  return { status, message: generic, fieldErrors: zodFieldErrors };
}

export function humanMessageFor(status?: number, codeHint?: string) {
  if (!status) return null;
  // Mapea estados comunes a mensajes amigables
  switch (status) {
    case 400:
      return "Solicitud inválida. Revisa los datos.";
    case 401:
      // codeHint: para login
      return codeHint === "login"
        ? "Correo o contraseña incorrectos."
        : "No autorizado.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return "Ruta no encontrada. Verifica la URL base del servidor.";
    case 409:
      return "El correo ya está registrado.";
    case 422:
      return "Contraseña incorrecta.";
    case 500:
      return "Error interno del servidor. Intenta más tarde.";
    default:
      return null;
  }
}
