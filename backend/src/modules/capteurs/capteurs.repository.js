class CapteursRepository {
  constructor(CapteurModel, CapteurReleveModel) {
    this.Capteur = CapteurModel;
    this.CapteurReleve = CapteurReleveModel;
  }

  findAllByUser(userId) {
    return this.Capteur.findAll({ where: { user_id: userId }, order: [['name', 'ASC']] });
  }

  findByIdAndUser(id, userId) {
    return this.Capteur.findOne({ where: { id, user_id: userId } });
  }

  create(data) {
    return this.Capteur.create(data);
  }

  async deleteByIdAndUser(id, userId) {
    const capteur = await this.findByIdAndUser(id, userId);
    if (!capteur) return false;
    await capteur.destroy();
    return true;
  }

  async updateParcelle(id, userId, parcelle_id) {
    const capteur = await this.findByIdAndUser(id, userId);
    if (!capteur) return null;
    return capteur.update({ parcelle_id: parcelle_id || null });
  }

  findByParcelle(parcelleId) {
    return this.Capteur.findAll({ where: { parcelle_id: parcelleId }, order: [['name', 'ASC']] });
  }

  latestReading(capteurId) {
    return this.CapteurReleve.findOne({
      where: { capteur_id: capteurId },
      order: [['timestamp', 'DESC']],
    });
  }
}

module.exports = CapteursRepository;
