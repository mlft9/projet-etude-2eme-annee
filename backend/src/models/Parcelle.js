const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Parcelle = sequelize.define('Parcelle', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    surface_ha: { type: DataTypes.DECIMAL(8, 2) },
    culture: { type: DataTypes.STRING(255) },
    latitude: { type: DataTypes.DECIMAL(10, 7) },
    longitude: { type: DataTypes.DECIMAL(10, 7) },
    geometry: { type: DataTypes.JSONB },
  }, {
    tableName: 'parcelles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  return Parcelle;
};
