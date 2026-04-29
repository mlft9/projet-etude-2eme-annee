const { validateCreate, validateAffiner, validatePlantAssistant } = require('./diagnostics.dto');

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
        culture: d.parcelle?.culture ?? null,
        latitude: d.parcelle?.latitude ?? null,
        longitude: d.parcelle?.longitude ?? null,
        surface_ha: d.parcelle?.surface_ha ?? null,
      }));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async alert(req, res) {
    try {
      const diagnosticId = req.params.id;
      const message = (req.body && req.body.message) || null;
      await this.diagnosticsService.alertFarmers(diagnosticId, req.user.id, message);
      res.json({ success: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
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

  async askPlantAssistant(req, res) {
    const error = validatePlantAssistant(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const result = await this.diagnosticsService.askPlantAssistant(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = DiagnosticsController;
