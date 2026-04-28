class ParcellesRepository {
  constructor(ParcelleModel) {
    this.Parcelle = ParcelleModel;
  }

  findAllByUser(userId) {
    return this.Parcelle.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']],
    });
  }

  create(data) {
    return this.Parcelle.create(data);
  }
}

module.exports = ParcellesRepository;
