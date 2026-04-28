/**
 * Valide et normalise les données d'une nouvelle parcelle.
 * @param {Object} body
 * @returns {{ error: string }|{ data: Object }}
 */
function validateCreate({ name, geometry } = {}) {
  if (!name) return { error: 'Nom requis' };
  if (!Array.isArray(geometry) || geometry.length < 3) {
    return { error: 'Polygone requis (>= 3 points)' };
  }
  return { data: null };
}

/**
 * Normalise un tableau de points bruts en { lat, lng }.
 * @param {Array} points
 * @returns {Array|null}
 */
function normalizePoints(points) {
  const cleaned = points
    .map((p) => ({
      lat: Number(p.lat ?? p.latitude),
      lng: Number(p.lng ?? p.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  return cleaned.length >= 3 ? cleaned : null;
}

module.exports = { validateCreate, normalizePoints };
