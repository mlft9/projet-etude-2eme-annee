require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { fork } = require('child_process');
const path = require('path');
const app = require('./app');
const { sequelize } = require('./models');
const seed = require('./seed');

const PORT = process.env.PORT || 3000;

function startIotSimulator() {
  const sim = fork(path.join(__dirname, 'scripts/iotSimulator.js'), [], { silent: false });
  sim.on('exit', (code) => {
    if (code !== 0) {
      console.warn('[iot] Simulateur arrêté (code', code, '), relance dans 5s...');
      setTimeout(startIotSimulator, 5000);
    }
  });
}

async function start() {
  await sequelize.authenticate();
  console.log('Connexion DB établie');

  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: true });
    console.log('Schéma DB synchronisé');
  }

  await seed();

  app.listen(PORT, () => {
    console.log(`Backend parcell-ia démarré sur le port ${PORT}`);
    startIotSimulator();
  });
}

start().catch((err) => {
  console.error('Erreur démarrage:', err);
  process.exit(1);
});
