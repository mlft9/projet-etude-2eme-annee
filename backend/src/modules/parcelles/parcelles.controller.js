const { validateCreate } = require('./parcelles.dto');

class ParcellesController {
  constructor(parcellesService) {
    this.parcellesService = parcellesService;
  }

  async getAll(req, res) {
    try {
      const parcelles = await this.parcellesService.getByUser(req.user.id);
      res.json(parcelles);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req, res) {
    const { error } = validateCreate(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const parcelle = await this.parcellesService.create(req.user.id, req.body);
      res.status(201).json(parcelle);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async delete(req, res) {
    try {
      await this.parcellesService.delete(req.params.id, req.user.id);
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async update(req, res) {
    const { name, culture } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Le nom est requis' });
    try {
      const parcelle = await this.parcellesService.update(req.params.id, req.user.id, { name: String(name).trim(), culture });
      res.json(parcelle);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async getLatestCapteurs(req, res) {
    try {
      const releve = await this.parcellesService.getLatestCapteurs(req.params.id, req.user.id);
      if (!releve) return res.status(404).json({ error: 'Aucun relevé capteur disponible' });
      res.json(releve);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = ParcellesController;
