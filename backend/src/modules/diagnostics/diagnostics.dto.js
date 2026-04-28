/**
 * Valide la demande de diagnostic.
 * @param {{ image_base64: string }} body
 * @returns {string|null} erreur ou null
 */
function validateCreate({ image_base64 } = {}) {
  if (!image_base64) return 'image_base64 requis';
  return null;
}

module.exports = { validateCreate };
