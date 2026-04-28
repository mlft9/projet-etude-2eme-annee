const OpenAI = require('openai');

const PROMPT = `Tu es un expert agronome. Analyse cette photo de plante/feuille et réponds en JSON strict :
{
  "maladie": "nom de la maladie ou 'Aucune maladie détectée'",
  "niveau_risque": "Aucun | Faible | Modéré | Élevé",
  "conseil": "conseil court et actionnable pour l'agriculteur"
}`;

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

  async analyzeImage(imageBase64) {
    if (!this.hasAzure && !this.hasOpenAI) return this._buildMockResponse();

    try {
      const client = this._buildClient();
      const model = this.hasAzure ? (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o') : 'gpt-4o';

      const response = await client.chat.completions.create({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        }],
        max_tokens: 300,
      });

      const raw = response.choices[0].message.content;
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
      return { ...parsed, raw };
    } catch (err) {
      console.error('[AiProvider] error, fallback mock:', err.message);
      return this._buildMockResponse();
    }
  }
}

module.exports = AiProvider;
