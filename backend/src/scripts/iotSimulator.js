require('dotenv').config();
const pool = require('../db/pool');

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
  const { rows } = await pool.query('SELECT id FROM parcelles');
  if (!rows.length) {
    console.log('[iot] Aucune parcelle en base, attente...');
    return;
  }

  const queries = rows.map((parcelle) => {
    const reading = buildReading();
    return pool.query(
      'INSERT INTO capteurs_releves (parcelle_id, temperature, humidite, pluviometrie) VALUES ($1, $2, $3, $4)',
      [parcelle.id, reading.temperature, reading.humidite, reading.pluviometrie]
    );
  });

  await Promise.all(queries);
  console.log(`[iot] Releves inserees: ${rows.length}`);
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
