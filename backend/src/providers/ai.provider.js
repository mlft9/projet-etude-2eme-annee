const OpenAI = require('openai');

const PROMPT_IMAGE = `Tu es un expert agronome. Analyse cette photo de plante/feuille et réponds en JSON strict :
{
  "maladie": "nom de la maladie ou 'Aucune maladie détectée'",
  "niveau_risque": "Aucun | Faible | Modéré | Élevé",
  "conseil": "conseil court et actionnable pour l'agriculteur",
  "score_confiance": 85
}
score_confiance est un entier 0-100 représentant ta certitude basée uniquement sur l'image.`;

function buildSensorPrompt(sensors) {
  return `Tu es un expert agronome. Voici les données capteurs terrain de la parcelle :
- Température sol : ${sensors.temperature}°C
- Humidité sol : ${sensors.humidite}%
- Pluviométrie récente : ${sensors.pluviometrie} mm
En tenant compte de ces capteurs et de la photo, affine ton diagnostic et réponds en JSON strict :
{
  "maladie": "nom de la maladie ou 'Aucune maladie détectée'",
  "niveau_risque": "Aucun | Faible | Modéré | Élevé",
  "conseil": "conseil court et actionnable pour l'agriculteur",
  "score_confiance": 92
}
score_confiance est un entier 0-100.`;
}

function hasUsableValue(value) {
  return Boolean(value && !value.includes('<') && !value.includes('ta_cle') && !value.includes('resource'));
}

class AiProvider {
  constructor() {
    this.hasAzure = hasUsableValue(process.env.AZURE_OPENAI_KEY) && hasUsableValue(process.env.AZURE_OPENAI_ENDPOINT);
    this.hasOpenAI = hasUsableValue(process.env.OPENAI_API_KEY);
  }

  _buildMockResponse() {
    const mock = {
      maladie: 'Stress hydrique probable',
      niveau_risque: 'Modéré',
      conseil: 'Verifier l humidite du sol et controler la parcelle sous 48h.',
      score_confiance: 42,
    };
    return { ...mock, raw: JSON.stringify(mock) };
  }

  _buildMockRefinedResponse(sensors) {
    const mock = {
      maladie: 'Stress hydrique confirmé',
      niveau_risque: sensors.humidite < 40 ? 'Élevé' : 'Modéré',
      conseil: `Irrigation recommandée. Humidité capteur à ${sensors.humidite}% — seuil critique à 40%.`,
      score_confiance: 88,
    };
    return { ...mock, raw: JSON.stringify(mock) };
  }

  _buildClient() {
    if (this.hasAzure) {
      return new OpenAI({
        apiKey: process.env.AZURE_OPENAI_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'}`,
        defaultQuery: { 'api-version': '2025-01-01-preview' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
      });
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async _analyze(prompt, imageBase64) {
    const client = this._buildClient();
    const model = this.hasAzure ? (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o') : 'gpt-4o';

    const response = await client.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      }],
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
    return { ...parsed, raw };
  }

  async analyzeImage(imageBase64) {
    if (!this.hasAzure && !this.hasOpenAI) return this._buildMockResponse();
    try {
      return await this._analyze(PROMPT_IMAGE, imageBase64);
    } catch (err) {
      console.error('[AiProvider] error, fallback mock:', err.message);
      return this._buildMockResponse();
    }
  }

  async analyzeWithSensors(imageBase64, sensors) {
    if (!this.hasAzure && !this.hasOpenAI) return this._buildMockRefinedResponse(sensors);
    try {
      return await this._analyze(buildSensorPrompt(sensors), imageBase64);
    } catch (err) {
      console.error('[AiProvider] sensor analysis error, fallback mock:', err.message);
      return this._buildMockRefinedResponse(sensors);
    }
  }
}

module.exports = AiProvider;
