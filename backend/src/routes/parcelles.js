const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM parcelles WHERE user_id = $1 ORDER BY name',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, culture, geometry, surface_ha } = req.body || {};

  if (!name || !Array.isArray(geometry) || geometry.length < 3) {
    return res.status(400).json({ error: 'Nom et polygone (>=3 points) requis.' });
  }

  const points = geometry
    .map((point) => ({
      lat: Number(point.lat ?? point.latitude),
      lng: Number(point.lng ?? point.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  if (points.length < 3) {
    return res.status(400).json({ error: 'Coordonnees invalides.' });
  }

  const centroid = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  const latitude = centroid.lat / points.length;
  const longitude = centroid.lng / points.length;

  try {
    const { rows } = await pool.query(
      `INSERT INTO parcelles (user_id, name, culture, surface_ha, latitude, longitude, geometry)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        name,
        culture || null,
        Number.isFinite(Number(surface_ha)) ? Number(surface_ha) : null,
        latitude,
        longitude,
        JSON.stringify(points),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
