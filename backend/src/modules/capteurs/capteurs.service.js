class CapteursService {
  constructor(capteursRepository) {
    this.capteursRepository = capteursRepository;
  }

  getByUser(userId) {
    return this.capteursRepository.findAllByUser(userId);
  }

  create(userId, { name, serial_number }) {
    if (!name?.trim()) throw Object.assign(new Error('Le nom est requis'), { status: 400 });
    return this.capteursRepository.create({
      user_id: userId,
      name: name.trim(),
      serial_number: serial_number?.trim() || null,
    });
  }

  async delete(id, userId) {
    const deleted = await this.capteursRepository.deleteByIdAndUser(id, userId);
    if (!deleted) throw Object.assign(new Error('Capteur introuvable'), { status: 404 });
  }

  async associate(id, userId, parcelle_id) {
    const capteur = await this.capteursRepository.updateParcelle(id, userId, parcelle_id);
    if (!capteur) throw Object.assign(new Error('Capteur introuvable'), { status: 404 });
    return capteur;
  }

  async getForParcelle(parcelleId) {
    const capteurs = await this.capteursRepository.findByParcelle(parcelleId);
    return Promise.all(capteurs.map(async (c) => {
      const releve = await this.capteursRepository.latestReading(c.id);
      return { ...c.toJSON(), latest: releve ? releve.toJSON() : null };
    }));
  }
}

module.exports = CapteursService;
