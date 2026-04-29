class ParcellesRepository {
  constructor(ParcelleModel, CapteurReleveModel, CapteurModel) {
    this.Parcelle = ParcelleModel;
    this.CapteurReleve = CapteurReleveModel;
    this.Capteur = CapteurModel;
  }

  findAllByUser(userId) {
    return this.Parcelle.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']],
    });
  }

  findByIdAndUser(id, userId) {
    return this.Parcelle.findOne({ where: { id, user_id: userId } });
  }

  create(data) {
    return this.Parcelle.create(data);
  }

  async deleteByIdAndUser(id, userId) {
    const parcelle = await this.findByIdAndUser(id, userId);
    if (!parcelle) return false;
    await parcelle.destroy();
    return true;
  }

  async updateByIdAndUser(id, userId, fields) {
    const parcelle = await this.findByIdAndUser(id, userId);
    if (!parcelle) return null;
    return parcelle.update(fields);
  }

  latestCapteurs(parcelleId) {
    return this.CapteurReleve.findOne({
      where: { parcelle_id: parcelleId },
      order: [['timestamp', 'DESC']],
    });
  }

  async getCapteursWithLatest(parcelleId) {
    const capteurs = await this.Capteur.findAll({
      where: { parcelle_id: parcelleId },
      order: [['name', 'ASC']],
    });
    return Promise.all(capteurs.map(async (c) => {
      const releve = await this.CapteurReleve.findOne({
        where: { capteur_id: c.id },
        order: [['timestamp', 'DESC']],
      });
      return { ...c.toJSON(), latest: releve ? releve.toJSON() : null };
    }));
  }
}

module.exports = ParcellesRepository;
