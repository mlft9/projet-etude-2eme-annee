/**
 * Entité Parcelle — représente une parcelle agricole.
 * @typedef {Object} ParcelleEntity
 * @property {number}   id
 * @property {number}   user_id
 * @property {string}   name
 * @property {number}   surface_ha
 * @property {string}   culture
 * @property {number}   latitude
 * @property {number}   longitude
 * @property {Array}    geometry  - tableau de points { lat, lng }
 * @property {Date}     created_at
 */

const { Parcelle } = require('../../models');
module.exports = Parcelle;
