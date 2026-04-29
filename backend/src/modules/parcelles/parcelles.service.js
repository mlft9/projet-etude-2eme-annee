const { normalizePoints } = require('./parcelles.dto');

class ParcellesService {
  constructor(parcellesRepository) {
    this.parcellesRepository = parcellesRepository;
  }

  getByUser(userId) {
    return this.parcellesRepository.findAllByUser(userId);
  }

  async getLatestCapteurs(parcelleId, userId) {
    const parcelle = await this.parcellesRepository.findByIdAndUser(parcelleId, userId);
    if (!parcelle) throw Object.assign(new Error('Parcelle introuvable'), { status: 404 });
    return this.parcellesRepository.latestCapteurs(parcelleId);
  }

  async delete(parcelleId, userId) {
    const deleted = await this.parcellesRepository.deleteByIdAndUser(parcelleId, userId);
    if (!deleted) throw Object.assign(new Error('Parcelle introuvable'), { status: 404 });
  }

  async update(parcelleId, userId, { name, culture }) {
    const parcelle = await this.parcellesRepository.updateByIdAndUser(parcelleId, userId, { name, culture: culture || null });
    if (!parcelle) throw Object.assign(new Error('Parcelle introuvable'), { status: 404 });
    return parcelle;
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
