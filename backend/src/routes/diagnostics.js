const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { analyzeImage } = require('../services/aiProvider');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT d.*, p.name as parcelle_name FROM diagnostics d LEFT JOIN parcelles p ON d.parcelle_id = p.id WHERE d.user_id = $1 ORDER BY d.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { parcelle_id, image_base64 } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'image_base64 requis' });

  try {
    const result = await analyzeImage(image_base64);

    const { rows } = await pool.query(
      `INSERT INTO diagnostics (user_id, parcelle_id, image_base64, maladie_detectee, niveau_risque, conseil, ia_raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, parcelle_id || null, image_base64, result.maladie, result.niveau_risque, result.conseil, result.raw]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
