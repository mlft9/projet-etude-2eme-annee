/**
 * Entité Diagnostic — résultat d'une analyse IA d'image de plante.
 * @typedef {Object} DiagnosticEntity
 * @property {number}  id
 * @property {number}  user_id
 * @property {number}  parcelle_id
 * @property {string}  image_base64
 * @property {string}  maladie_detectee
 * @property {string}  niveau_risque  - Aucun | Faible | Modéré | Élevé
 * @property {string}  conseil
 * @property {string}  ia_raw_response
 * @property {Date}    created_at
 */

const { Diagnostic } = require('../../models');
module.exports = Diagnostic;
