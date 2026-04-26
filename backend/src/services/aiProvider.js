const OpenAI = require('openai');

const PROMPT = `Tu es un expert agronome. Analyse cette photo de plante/feuille et réponds en JSON strict :
{
  "maladie": "nom de la maladie ou 'Aucune maladie détectée'",
  "niveau_risque": "Aucun | Faible | Modéré | Élevé",
  "conseil": "conseil court et actionnable pour l'agriculteur"
}`;

async function analyzeImage(imageBase64) {
  const useAzure = !!(process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT);

  const client = useAzure
    ? new OpenAI({
        apiKey: process.env.AZURE_OPENAI_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'}`,
        defaultQuery: { 'api-version': '2024-02-15-preview' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
      })
    : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
}

module.exports = { analyzeImage };
