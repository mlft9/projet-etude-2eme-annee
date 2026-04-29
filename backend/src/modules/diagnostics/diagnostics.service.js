const { CapteurReleve } = require('../../models');

function normalizeConfidence(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim();
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

class DiagnosticsService {
  constructor(diagnosticsRepository, aiProvider) {
    this.diagnosticsRepository = diagnosticsRepository;
    this.aiProvider = aiProvider;
  }

  getByUser(userId) {
    return this.diagnosticsRepository.findAllByUser(userId);
  }

  async create(userId, { parcelle_id, image_base64 }) {
    let result = await this.aiProvider.analyzeImage(image_base64);
    const confidence = normalizeConfidence(result.indice_confiance_pct);

    if (confidence !== null && confidence < 70 && parcelle_id) {
      const latestSensor = await CapteurReleve.findOne({
        where: { parcelle_id },
        order: [['timestamp', 'DESC']],
      });

      if (latestSensor) {
        const sensorData = {
          temperature: latestSensor.temperature,
          humidite: latestSensor.humidite,
          pluviometrie: latestSensor.pluviometrie,
          timestamp: latestSensor.timestamp,
        };
        result = await this.aiProvider.analyzeImage(image_base64, sensorData);
      }
    }

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

  async askPlantAssistant(userId, { plant_name, question, context }) {
    const answer = await this.aiProvider.askPlantQuestion({
      plantName: plant_name,
      question,
      context,
    });

    return {
      user_id: userId,
      plant_name,
      question,
      answer,
    };
  }

  async alertFarmers(diagnosticId, userId, message) {
    // For now: verify diagnostic exists and belongs to user, then emit/log an alert.
    const diagnostic = await this.diagnosticsRepository.findByIdAndUser(diagnosticId, userId);
    if (!diagnostic) throw Object.assign(new Error('Diagnostic introuvable'), { status: 404 });

    // Placeholder: in future this could enqueue notifications, push messages or create an alerts table.
    // For now we simply log and return success.
    console.log(`ALERT from user ${userId} for diagnostic ${diagnosticId}: ${message || '<no message>'}`);
    return { alerted: true };
  }
}

module.exports = DiagnosticsService;
