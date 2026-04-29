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

  await sequelize.query(`
    ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS score_confiance INTEGER;
    ALTER TABLE diagnostics DROP CONSTRAINT IF EXISTS diagnostics_parcelle_id_fkey;
    ALTER TABLE diagnostics ADD CONSTRAINT diagnostics_parcelle_id_fkey
      FOREIGN KEY (parcelle_id) REFERENCES parcelles(id) ON DELETE SET NULL;
  `);
  console.log('Schéma DB synchronisé');

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
