const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CapteurReleve = sequelize.define('CapteurReleve', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    parcelle_id: { type: DataTypes.INTEGER },
    capteur_id: { type: DataTypes.INTEGER },
    temperature: { type: DataTypes.DECIMAL(5, 2) },
    humidite: { type: DataTypes.DECIMAL(5, 2) },
    pluviometrie: { type: DataTypes.DECIMAL(6, 2) },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'capteurs_releves',
    timestamps: false,
  });

  return CapteurReleve;
};
