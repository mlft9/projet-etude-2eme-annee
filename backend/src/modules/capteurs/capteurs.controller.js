class CapteursController {
  constructor(capteursService) {
    this.capteursService = capteursService;
  }

  async getAll(req, res) {
    try {
      const capteurs = await this.capteursService.getByUser(req.user.id);
      res.json(capteurs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req, res) {
    try {
      const capteur = await this.capteursService.create(req.user.id, req.body);
      res.status(201).json(capteur);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async delete(req, res) {
    try {
      await this.capteursService.delete(req.params.id, req.user.id);
      res.status(204).send();
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async associate(req, res) {
    try {
      const capteur = await this.capteursService.associate(req.params.id, req.user.id, req.body.parcelle_id ?? null);
      res.json(capteur);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = CapteursController;
