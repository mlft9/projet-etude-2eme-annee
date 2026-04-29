const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Capteur = sequelize.define('Capteur', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    serial_number: { type: DataTypes.STRING },
    parcelle_id: { type: DataTypes.INTEGER },
  }, {
    tableName: 'capteurs',
    timestamps: false,
    createdAt: 'created_at',
  });

  return Capteur;
};
