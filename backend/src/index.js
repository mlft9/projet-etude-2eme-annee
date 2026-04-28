require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.authenticate();
  console.log('Connexion DB établie');

  // En développement : synchronise le schéma automatiquement.
  // En production : utiliser `npx sequelize-cli db:migrate`.
  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: true });
    console.log('Schéma DB synchronisé');
  }

  app.listen(PORT, () => {
    console.log(`Backend parcell-ia démarré sur le port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Erreur démarrage:', err);
  process.exit(1);
});
