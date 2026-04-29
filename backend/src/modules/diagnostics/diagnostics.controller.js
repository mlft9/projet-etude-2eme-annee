const { validateCreate, validateAffiner } = require('./diagnostics.dto');

class DiagnosticsController {
  constructor(diagnosticsService) {
    this.diagnosticsService = diagnosticsService;
  }

  async getAll(req, res) {
    try {
      const diagnostics = await this.diagnosticsService.getByUser(req.user.id);
      // Aplatit parcelle_name pour garder la même forme de réponse qu'avant
      const data = diagnostics.map((d) => ({
        ...d.toJSON(),
        parcelle_name: d.parcelle?.name ?? null,
      }));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req, res) {
    const error = validateCreate(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const diagnostic = await this.diagnosticsService.create(req.user.id, req.body);
      res.status(201).json(diagnostic);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async affiner(req, res) {
    const error = validateAffiner(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const diagnostic = await this.diagnosticsService.affiner(req.params.id, req.user.id, req.body);
      res.json(diagnostic);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = DiagnosticsController;
