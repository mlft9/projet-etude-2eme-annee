class ParcellesRepository {
  constructor(ParcelleModel, CapteurReleveModel) {
    this.Parcelle = ParcelleModel;
    this.CapteurReleve = CapteurReleveModel;
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
}

module.exports = ParcellesRepository;
