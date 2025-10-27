import { CanchasRepo } from '../repositories/canchas.repo';

const DEFAULT_NOCTURNO_DESDE = 18; // 18:00
const DEFAULT_NOCTURNO_HASTA = 6;  // 06:00

function esNocturno(hora: number) {
  // noche: 18–24 o 0–6
  return hora >= DEFAULT_NOCTURNO_DESDE || hora < DEFAULT_NOCTURNO_HASTA;
}

function horasEntre(hIni: string, hFin: string) {
  const [ih, im] = hIni.split(':').map(Number);
  const [fh, fm] = hFin.split(':').map(Number);
  let start = ih * 60 + im;
  let end = fh * 60 + fm;
  if (end <= start) end += 24 * 60; // cruza medianoche
  return (end - start) / 60;
}

export const PreciosService = {
  async precificarSlots(
    canchaId: string,
    slots: { id: string; horaIni: string; horaFin: string }[],
  ) {
    const precios = await CanchasRepo.getPrecios(canchaId);
    if (!precios) throw new Error('Cancha no encontrada');

    const precioDiurno =
      precios.cancha.precioDiurnoPorHora ??
      precios.complejo.precioDiurnoPorHora ??
      0;

    const precioNocturno =
      precios.cancha.precioNocturnoPorHora ??
      precios.complejo.precioNocturnoPorHora ??
      0;

    return slots.map((s) => {
      const hIni = Number(s.horaIni.slice(0, 2));
      const noct = esNocturno(hIni);
      const durHoras = horasEntre(s.horaIni, s.horaFin);
      const precioBs = (noct ? precioNocturno : precioDiurno) * durHoras;

      return { ...s, tipo: noct ? 'NOCTURNO' : 'DIURNO', precioBs };
    });
  },
};
