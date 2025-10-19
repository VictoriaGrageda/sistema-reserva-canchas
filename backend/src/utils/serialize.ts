const toNum = (v: any) => (v === null || v === undefined ? v : Number(v));

export function serializeComplejo(c: any) {
  return {
    ...c,
    precioDiurnoPorHora: toNum(c.precioDiurnoPorHora),
    precioNocturnoPorHora: toNum(c.precioNocturnoPorHora),
    lat: toNum(c.lat),
    lng: toNum(c.lng),
    canchas: (c.canchas || []).map((k: any) => ({
      ...k,
      precioDiurnoPorHora: toNum(k.precioDiurnoPorHora),
      precioNocturnoPorHora: toNum(k.precioNocturnoPorHora),
    })),
  };
}
