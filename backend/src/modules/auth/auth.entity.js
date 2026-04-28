/**
 * Entité User — représente un utilisateur tel que stocké en base.
 * @typedef {Object} UserEntity
 * @property {number} id
 * @property {string} email
 * @property {string} password_hash
 * @property {string} name
 * @property {Date}   created_at
 */

const { User } = require('../../models');
module.exports = User;
