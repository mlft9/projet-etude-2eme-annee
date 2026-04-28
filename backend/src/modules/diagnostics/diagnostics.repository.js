const { Parcelle } = require('../../models');

class DiagnosticsRepository {
  constructor(DiagnosticModel) {
    this.Diagnostic = DiagnosticModel;
  }

  findAllByUser(userId) {
    return this.Diagnostic.findAll({
      where: { user_id: userId },
      include: [{ model: Parcelle, as: 'parcelle', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
    });
  }

  create(data) {
    return this.Diagnostic.create(data);
  }
}

module.exports = DiagnosticsRepository;
