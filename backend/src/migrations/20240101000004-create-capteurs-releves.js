'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('capteurs_releves', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      parcelle_id: {
        type: Sequelize.INTEGER,
        references: { model: 'parcelles', key: 'id' },
        onDelete: 'CASCADE',
      },
      temperature: { type: Sequelize.DECIMAL(5, 2) },
      humidite: { type: Sequelize.DECIMAL(5, 2) },
      pluviometrie: { type: Sequelize.DECIMAL(6, 2) },
      timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('capteurs_releves');
  },
};
