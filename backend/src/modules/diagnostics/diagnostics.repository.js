const { Parcelle } = require('../../models');

class DiagnosticsRepository {
  constructor(DiagnosticModel) {
    this.Diagnostic = DiagnosticModel;
  }

  findAllByUser(userId) {
    return this.Diagnostic.findAll({
      where: { user_id: userId },
      include: [{ model: Parcelle, as: 'parcelle', attributes: ['name', 'culture'] }],
      order: [['created_at', 'DESC']],
    });
  }

  findByIdAndUser(id, userId) {
    return this.Diagnostic.findOne({ where: { id, user_id: userId } });
  }

  create(data) {
    return this.Diagnostic.create(data);
  }

  async update(id, data) {
    await this.Diagnostic.update(data, { where: { id } });
    return this.Diagnostic.findByPk(id);
  }
}

module.exports = DiagnosticsRepository;
