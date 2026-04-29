const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Diagnostic = sequelize.define('Diagnostic', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    parcelle_id: { type: DataTypes.INTEGER },
    image_url: { type: DataTypes.TEXT },
    image_base64: { type: DataTypes.TEXT },
    maladie_detectee: { type: DataTypes.STRING(255) },
    niveau_risque: { type: DataTypes.STRING(50) },
    conseil: { type: DataTypes.TEXT },
    ia_raw_response: { type: DataTypes.TEXT },
    score_confiance: { type: DataTypes.INTEGER },
  }, {
    tableName: 'diagnostics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  return Diagnostic;
};
