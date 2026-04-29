const sequelize = require('../config/database');
const defineUser = require('./User');
const defineParcelle = require('./Parcelle');
const defineDiagnostic = require('./Diagnostic');
const defineCapteurReleve = require('./CapteurReleve');
const defineCapteur = require('./Capteur');

const User = defineUser(sequelize);
const Parcelle = defineParcelle(sequelize);
const Diagnostic = defineDiagnostic(sequelize);
const CapteurReleve = defineCapteurReleve(sequelize);
const Capteur = defineCapteur(sequelize);

User.hasMany(Parcelle, { foreignKey: 'user_id' });
Parcelle.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Diagnostic, { foreignKey: 'user_id' });
Diagnostic.belongsTo(User, { foreignKey: 'user_id' });

Parcelle.hasMany(Diagnostic, { foreignKey: 'parcelle_id' });
Diagnostic.belongsTo(Parcelle, { foreignKey: 'parcelle_id', as: 'parcelle' });

Parcelle.hasMany(CapteurReleve, { foreignKey: 'parcelle_id' });
CapteurReleve.belongsTo(Parcelle, { foreignKey: 'parcelle_id' });

User.hasMany(Capteur, { foreignKey: 'user_id' });
Capteur.belongsTo(User, { foreignKey: 'user_id' });

Parcelle.hasMany(Capteur, { foreignKey: 'parcelle_id' });
Capteur.belongsTo(Parcelle, { foreignKey: 'parcelle_id' });

Capteur.hasMany(CapteurReleve, { foreignKey: 'capteur_id' });
CapteurReleve.belongsTo(Capteur, { foreignKey: 'capteur_id' });

module.exports = { sequelize, User, Parcelle, Diagnostic, CapteurReleve, Capteur };
