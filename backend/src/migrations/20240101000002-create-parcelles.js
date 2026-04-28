'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('parcelles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      surface_ha: { type: Sequelize.DECIMAL(8, 2) },
      culture: { type: Sequelize.STRING(255) },
      latitude: { type: Sequelize.DECIMAL(10, 7) },
      longitude: { type: Sequelize.DECIMAL(10, 7) },
      geometry: { type: Sequelize.JSONB },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('parcelles');
  },
};
