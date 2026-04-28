const { normalizePoints } = require('./parcelles.dto');

class ParcellesService {
  constructor(parcellesRepository) {
    this.parcellesRepository = parcellesRepository;
  }

  getByUser(userId) {
    return this.parcellesRepository.findAllByUser(userId);
  }

  create(userId, { name, culture, geometry, surface_ha }) {
    const points = normalizePoints(geometry);
    if (!points) throw Object.assign(new Error('Coordonnées invalides'), { status: 400 });

    const centroid = points.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 }
    );

    return this.parcellesRepository.create({
      user_id: userId,
      name,
      culture: culture || null,
      surface_ha: Number.isFinite(Number(surface_ha)) ? Number(surface_ha) : null,
      latitude: centroid.lat / points.length,
      longitude: centroid.lng / points.length,
      geometry: points,
    });
  }
}

module.exports = ParcellesService;
