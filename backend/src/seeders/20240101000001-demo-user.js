'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('demo123', 10);
    await queryInterface.bulkInsert('users', [
      {
        email: 'demo@parcell-ia.com',
        password_hash: passwordHash,
        name: 'Agriculteur Demo',
        created_at: new Date(),
      },
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'demo@parcell-ia.com' });
  },
};
