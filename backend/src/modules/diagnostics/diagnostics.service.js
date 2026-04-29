class DiagnosticsService {
  constructor(diagnosticsRepository, aiProvider) {
    this.diagnosticsRepository = diagnosticsRepository;
    this.aiProvider = aiProvider;
  }

  getByUser(userId) {
    return this.diagnosticsRepository.findAllByUser(userId);
  }

  async create(userId, { parcelle_id, image_base64 }) {
    const result = await this.aiProvider.analyzeImage(image_base64);

    return this.diagnosticsRepository.create({
      user_id: userId,
      parcelle_id: parcelle_id || null,
      image_base64,
      maladie_detectee: result.maladie,
      niveau_risque: result.niveau_risque,
      conseil: result.conseil,
      ia_raw_response: result.raw,
      score_confiance: result.score_confiance ?? null,
    });
  }

  async affiner(diagnosticId, userId, capteurData) {
    const diagnostic = await this.diagnosticsRepository.findByIdAndUser(diagnosticId, userId);
    if (!diagnostic) throw Object.assign(new Error('Diagnostic introuvable'), { status: 404 });

    const result = await this.aiProvider.analyzeWithSensors(diagnostic.image_base64, capteurData);

    return this.diagnosticsRepository.update(diagnosticId, {
      maladie_detectee: result.maladie,
      niveau_risque: result.niveau_risque,
      conseil: result.conseil,
      ia_raw_response: result.raw,
      score_confiance: result.score_confiance ?? null,
    });
  }
}

module.exports = DiagnosticsService;
