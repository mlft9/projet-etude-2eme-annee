require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });

const MIN_INTERVAL_MS = 10_000;
const MAX_INTERVAL_MS = 30_000;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function buildReading() {
  return {
    temperature: Number(randomBetween(10, 35).toFixed(2)),
    humidite: Number(randomBetween(30, 90).toFixed(2)),
    pluviometrie: Number(randomBetween(0, 20).toFixed(2)),
  };
}

async function insertReadings() {
  const { rows } = await pool.query('SELECT id, parcelle_id FROM capteurs WHERE parcelle_id IS NOT NULL');
  if (!rows.length) {
    console.log('[iot] Aucun capteur associé à une parcelle, attente...');
    return;
  }

  const queries = rows.map((capteur) => {
    const reading = buildReading();
    return pool.query(
      'INSERT INTO capteurs_releves (capteur_id, parcelle_id, temperature, humidite, pluviometrie, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
      [capteur.id, capteur.parcelle_id, reading.temperature, reading.humidite, reading.pluviometrie]
    );
  });

  await Promise.all(queries);
  console.log(`[iot] Releves inseres: ${rows.length} capteur(s)`);
}

let stopped = false;

async function loop() {
  if (stopped) return;

  try {
    await insertReadings();
  } catch (error) {
    console.error('[iot] Erreur insertion:', error.message);
  }

  const delay = Math.round(randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
  setTimeout(loop, delay);
}

function shutdown() {
  stopped = true;
  pool.end().finally(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[iot] Simulateur capteurs demarre.');
loop();
