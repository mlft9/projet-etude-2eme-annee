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

  await sequelize.query(`ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS score_confiance INTEGER`);
  await sequelize.query(`ALTER TABLE diagnostics DROP CONSTRAINT IF EXISTS diagnostics_parcelle_id_fkey`);
  await sequelize.query(`ALTER TABLE diagnostics ADD CONSTRAINT diagnostics_parcelle_id_fkey FOREIGN KEY (parcelle_id) REFERENCES parcelles(id) ON DELETE SET NULL`);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS capteurs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      serial_number VARCHAR(255),
      parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await sequelize.query(`ALTER TABLE capteurs_releves ADD COLUMN IF NOT EXISTS capteur_id INTEGER REFERENCES capteurs(id) ON DELETE SET NULL`);
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
