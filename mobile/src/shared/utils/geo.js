export function parseGeometry(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizePolygon(geometry) {
  const points = parseGeometry(geometry);
  if (!points) return null;
  const cleaned = points
    .map((p) => ({
      lat: Number(p.lat ?? p.latitude),
      lng: Number(p.lng ?? p.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  return cleaned.length >= 3 ? cleaned : null;
}

export function computeSurfaceHa(points) {
  if (!points || points.length < 3) return 0;
  const R = 6378137;
  const toRad = (deg) => (deg * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area +=
      toRad(b.lng - a.lng) *
      (2 + Math.sin(toRad(a.lat)) + Math.sin(toRad(b.lat)));
  }
  area = (area * R * R) / 2;
  return Math.abs(area) / 10000;
}
