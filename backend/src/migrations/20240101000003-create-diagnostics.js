'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('diagnostics', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      parcelle_id: {
        type: Sequelize.INTEGER,
        references: { model: 'parcelles', key: 'id' },
        onDelete: 'SET NULL',
      },
      image_url: { type: Sequelize.TEXT },
      image_base64: { type: Sequelize.TEXT },
      maladie_detectee: { type: Sequelize.STRING(255) },
      niveau_risque: { type: Sequelize.STRING(50) },
      conseil: { type: Sequelize.TEXT },
      ia_raw_response: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('diagnostics');
  },
};
