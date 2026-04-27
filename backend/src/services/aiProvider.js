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

function buildMockResponse() {
  return {
    maladie: 'Stress hydrique probable',
    niveau_risque: 'Modéré',
    conseil: 'Verifier l humidite du sol et controler la parcelle sous 48h.',
    raw: JSON.stringify({
      maladie: 'Stress hydrique probable',
      niveau_risque: 'Modéré',
      conseil: 'Verifier l humidite du sol et controler la parcelle sous 48h.',
    }),
  };
}

async function analyzeImage(imageBase64) {
  const hasAzure = hasUsableValue(process.env.AZURE_OPENAI_KEY) && hasUsableValue(process.env.AZURE_OPENAI_ENDPOINT);
  const hasOpenAI = hasUsableValue(process.env.OPENAI_API_KEY);
  const useAzure = hasAzure;

  if (!hasAzure && !hasOpenAI) {
    return buildMockResponse();
  }

  const client = useAzure
    ? new OpenAI({
        apiKey: process.env.AZURE_OPENAI_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'}`,
        defaultQuery: { 'api-version': '2025-01-01-preview' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
      })
    : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o' : 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());

    return { ...parsed, raw };
  } catch (err) {
    console.error('[aiProvider] Azure error, fallback mock:', err.message);
    return buildMockResponse();
  }
}

module.exports = { analyzeImage };
