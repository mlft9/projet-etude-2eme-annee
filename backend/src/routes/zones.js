const express = require('express');
const pool = require('../db/pool');

const router = express.Router();
const sseClients = new Set();
const drawnZones = new Map();

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildParcellePolygon(latitude, longitude, surfaceHa) {
  const lat = toNumber(latitude);
  const lon = toNumber(longitude);

  if (lat === null || lon === null) {
    return null;
  }

  // Approximation visuelle simple: plus la surface est grande, plus le polygone est large.
  const size = Math.max(0.0012, Math.sqrt(toNumber(surfaceHa, 1)) * 0.0012);

  return [
    [lon - size, lat - size],
    [lon + size, lat - size],
    [lon + size, lat + size],
    [lon - size, lat + size],
    [lon - size, lat - size],
  ];
}

function normalizeRisk(risk) {
  if (!risk) return 'Aucun';
  if (risk === 'Élevé' || risk === 'Eleve') return 'Élevé';
  if (risk === 'Modéré' || risk === 'Modere') return 'Modéré';
  if (risk === 'Faible') return 'Faible';
  return 'Aucun';
}

function buildSimulatedMetrics(zoneId) {
  const t = Date.now() / 1000;
  const phase = Number(zoneId || 1);

  return {
    temperature: Number((19 + Math.sin(t / 8 + phase) * 6).toFixed(1)),
    humidite: Number((46 + Math.cos(t / 10 + phase) * 20).toFixed(1)),
    pluviometrie: Number((Math.max(0, 2 + Math.sin(t / 12 + phase) * 3)).toFixed(1)),
    simulated: true,
  };
}

function mapRowToFeature(row) {
  const polygonCoordinates = buildParcellePolygon(row.latitude, row.longitude, row.surface_ha);
  if (!polygonCoordinates) {
    return null;
  }

  const hasSensorData = row.temperature !== null && row.humidite !== null;
  const simulated = hasSensorData ? null : buildSimulatedMetrics(row.id);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [polygonCoordinates],
    },
    properties: {
      id: row.id,
      name: row.name,
      culture: row.culture,
      surface_ha: row.surface_ha,
      niveau_risque: normalizeRisk(row.niveau_risque),
      maladie_detectee: row.maladie_detectee || 'Aucune maladie détectée',
      temperature: hasSensorData ? toNumber(row.temperature) : simulated.temperature,
      humidite: hasSensorData ? toNumber(row.humidite) : simulated.humidite,
      pluviometrie: hasSensorData ? toNumber(row.pluviometrie) : simulated.pluviometrie,
      source_capteur: hasSensorData ? 'reel' : 'simule',
      updated_at: hasSensorData ? row.capteur_timestamp : new Date().toISOString(),
      is_drawn: false,
    },
  };
}

function buildFallbackParcelleFeatures() {
  const fallbackParcelles = [
    { id: 1, name: 'Parcelle Nord', culture: 'Ble tendre', surface_ha: 12.5, latitude: 48.888, longitude: 2.34, niveau_risque: 'Modéré', maladie_detectee: 'Stress hydrique probable' },
    { id: 2, name: 'Parcelle Sud', culture: 'Mais', surface_ha: 8.2, latitude: 48.815, longitude: 2.4, niveau_risque: 'Faible', maladie_detectee: 'Aucune maladie détectée' },
    { id: 3, name: 'Parcelle Est', culture: 'Colza', surface_ha: 15, latitude: 48.87, longitude: 2.46, niveau_risque: 'Élevé', maladie_detectee: 'Mildiou suspecté' },
  ];

  return fallbackParcelles.map((row) => {
    const polygonCoordinates = buildParcellePolygon(row.latitude, row.longitude, row.surface_ha);
    const metrics = buildSimulatedMetrics(row.id);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polygonCoordinates],
      },
      properties: {
        id: row.id,
        name: row.name,
        culture: row.culture,
        surface_ha: row.surface_ha,
        niveau_risque: normalizeRisk(row.niveau_risque),
        maladie_detectee: row.maladie_detectee,
        temperature: metrics.temperature,
        humidite: metrics.humidite,
        pluviometrie: metrics.pluviometrie,
        source_capteur: 'simule',
        updated_at: new Date().toISOString(),
        is_drawn: false,
      },
    };
  });
}

async function readParcelleFeatures() {
  try {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.culture,
         p.surface_ha,
         p.latitude,
         p.longitude,
         c.temperature,
         c.humidite,
         c.pluviometrie,
         c.timestamp AS capteur_timestamp,
         d.niveau_risque,
         d.maladie_detectee
       FROM parcelles p
       LEFT JOIN LATERAL (
         SELECT temperature, humidite, pluviometrie, timestamp
         FROM capteurs_releves
         WHERE parcelle_id = p.id
         ORDER BY timestamp DESC
         LIMIT 1
       ) c ON true
       LEFT JOIN LATERAL (
         SELECT niveau_risque, maladie_detectee
         FROM diagnostics
         WHERE parcelle_id = p.id
         ORDER BY created_at DESC
         LIMIT 1
       ) d ON true
       ORDER BY p.id ASC`
    );

    const features = rows.map(mapRowToFeature).filter(Boolean);
    return features.length ? features : buildFallbackParcelleFeatures();
  } catch {
    return buildFallbackParcelleFeatures();
  }
}

function readDrawnFeatures() {
  return [...drawnZones.values()].map((item) => {
    const metrics = buildSimulatedMetrics(item.properties.id);

    return {
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        ...item.properties,
        temperature: metrics.temperature,
        humidite: metrics.humidite,
        pluviometrie: metrics.pluviometrie,
        updated_at: new Date().toISOString(),
        source_capteur: 'simule',
        is_drawn: true,
      },
    };
  });
}

async function buildPayload() {
  const parcelleFeatures = await readParcelleFeatures();
  const drawingFeatures = readDrawnFeatures();

  return {
    type: 'FeatureCollection',
    generated_at: new Date().toISOString(),
    features: [...parcelleFeatures, ...drawingFeatures],
  };
}

async function broadcastZones() {
  if (!sseClients.size) {
    return;
  }

  try {
    const payload = await buildPayload();
    const serialized = `data: ${JSON.stringify(payload)}\n\n`;

    for (const client of sseClients) {
      client.write(serialized);
    }
  } catch (error) {
    const serialized = `data: ${JSON.stringify({ error: 'stream_error', message: error.message })}\n\n`;
    for (const client of sseClients) {
      client.write(serialized);
    }
  }
}

setInterval(broadcastZones, 3000);

router.get('/', async (req, res) => {
  try {
    const payload = await buildPayload();
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  try {
    const payload = await buildPayload();
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }

  req.on('close', () => {
    sseClients.delete(res);
  });
});

router.get('/drawings', (req, res) => {
  res.json({
    type: 'FeatureCollection',
    generated_at: new Date().toISOString(),
    features: readDrawnFeatures(),
  });
});

router.post('/drawings', express.json({ limit: '2mb' }), (req, res) => {
  const { geometry, properties } = req.body || {};

  if (!geometry || geometry.type !== 'Polygon') {
    return res.status(400).json({ error: 'geometry Polygon requise' });
  }

  const id = Number(properties?.id) || Date.now();
  const name = properties?.name || `Zone ${id}`;

  drawnZones.set(id, {
    geometry,
    properties: {
      id,
      name,
      culture: properties?.culture || 'Zone dessinée',
      surface_ha: toNumber(properties?.surface_ha, null),
      niveau_risque: normalizeRisk(properties?.niveau_risque),
      maladie_detectee: properties?.maladie_detectee || 'Observation manuelle',
      is_drawn: true,
    },
  });

  broadcastZones();

  return res.status(201).json({ ok: true, id });
});

module.exports = router;
