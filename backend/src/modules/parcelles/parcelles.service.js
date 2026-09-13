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

  async getCapteurs(parcelleId, userId) {
    const parcelle = await this.parcellesRepository.findByIdAndUser(parcelleId, userId);
    if (!parcelle) throw Object.assign(new Error('Parcelle introuvable'), { status: 404 });
    return this.parcellesRepository.getCapteursWithLatest(parcelleId);
  }

  async delete(parcelleId, userId) {
    const deleted = await this.parcellesRepository.deleteByIdAndUser(parcelleId, userId);
    if (!deleted) throw Object.assign(new Error('Parcelle introuvable'), { status: 404 });
  }

  async getSoilHealth(parcelleId, userId) {
    const parcelle = await this.parcellesRepository.findByIdAndUser(parcelleId, userId);
    if (!parcelle) throw Object.assign(new Error('Parcelle introuvable'), { status: 404 });

    const capteurs = await this.parcellesRepository.getCapteursWithLatest(parcelleId);
    let avgHumidity = 50;
    if (capteurs && capteurs.length > 0 && capteurs[0].latest) {
      avgHumidity = capteurs[0].latest.humidite;
    }

    const culture = parcelle.culture ? parcelle.culture.toLowerCase() : 'aucune';
    
    // Algorithme de simulation de santé du sol (mock)
    let nutrition = 100;
    let hydration = avgHumidity;
    let pathogenRisk = 20;
    let advice = 'Santé du sol optimale.';

    if (culture.includes('maïs') || culture.includes('ble') || culture.includes('blé')) {
      nutrition = 45; // Céréales gourmandes
      advice = 'Épuisement en azote détecté. Envisagez une rotation avec une légumineuse (ex: luzerne, pois) pour la prochaine saison.';
      pathogenRisk = 50;
    } else if (culture.includes('colza') || culture.includes('tournesol')) {
      nutrition = 60;
      advice = 'Les réserves en potassium baissent. Fertilisation recommandée.';
    } else if (culture.includes('vigne')) {
      nutrition = 80;
      pathogenRisk = 60;
      advice = 'Attention au risque fongique. Surveillez l\'aération des sols.';
    }

    if (hydration < 30) {
      pathogenRisk += 10;
      nutrition -= 10;
      advice += ' Stress hydrique : l\'absorption des nutriments est bloquée.';
    }

    const globalScore = Math.round((nutrition + hydration + (100 - pathogenRisk)) / 3);

    return {
      globalScore,
      metrics: {
        hydration: Math.round(hydration),
        nutrition: Math.max(0, Math.round(nutrition)),
        pathogenRisk: Math.min(100, Math.round(pathogenRisk))
      },
      advice
    };
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
