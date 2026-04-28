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
    });
  }
}

module.exports = DiagnosticsService;
