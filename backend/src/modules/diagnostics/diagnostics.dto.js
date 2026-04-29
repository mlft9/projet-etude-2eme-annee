/**
 * Valide la demande de diagnostic.
 * @param {{ image_base64: string }} body
 * @returns {string|null} erreur ou null
 */
function validateCreate({ image_base64 } = {}) {
  if (!image_base64) return 'image_base64 requis';
  return null;
}

function validateAffiner({ temperature, humidite, pluviometrie } = {}) {
  if (temperature == null || humidite == null || pluviometrie == null)
    return 'temperature, humidite et pluviometrie requis';
  return null;
}

function validatePlantAssistant({ plant_name, question } = {}) {
  if (!plant_name) return 'plant_name requis';
  if (!question) return 'question requise';
  return null;
}

module.exports = { validateCreate, validateAffiner, validatePlantAssistant };
