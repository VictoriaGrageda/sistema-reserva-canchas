export type LocationIQResult = {
  latitude: number;
  longitude: number;
  address: string;
};

const KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
const buildUrl = (path: string, params: Record<string, string | number>) => {
  if (!KEY) {
    throw new Error('Debes definir EXPO_PUBLIC_LOCATIONIQ_KEY en tu entorno (LocationIQ)');
  }
  const search = new URLSearchParams({ key: KEY, ...params, format: 'json' });
  return `https://us1.locationiq.com/v1/${path}.php?${search.toString()}`;
};

const normalizePlace = (place: any): LocationIQResult => ({
  latitude: Number(place.lat),
  longitude: Number(place.lon),
  address: place.display_name,
});

export const LocationIQService = {
  async search(query: string): Promise<LocationIQResult> {
    if (!query || !query.trim()) {
      throw new Error('Ingresa una direccion para buscar');
    }
    const url = buildUrl('search', { q: query, limit: 1 });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('No se pudo buscar la direccion');
    }
    const payload = await response.json();
    const place = Array.isArray(payload) ? payload[0] : payload;
    if (!place) {
      throw new Error('No se encontraron resultados para esa direccion');
    }
    return normalizePlace(place);
  },
  async reverse(lat: number, lon: number): Promise<LocationIQResult> {
    const url = buildUrl('reverse', { lat, lon, zoom: 16 });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('No se pudo obtener la direccion de las coordenadas');
    }
    const payload = await response.json();
    if (!payload || !payload.display_name) {
      throw new Error('No se pudo interpretar la direccion');
    }
    return {
      latitude: Number(lat),
      longitude: Number(lon),
      address: payload.display_name,
    };
  },
};
