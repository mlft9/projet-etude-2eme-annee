-- Schéma initial Parcell-IA

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parcelles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  surface_ha DECIMAL(8,2),
  culture VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  parcelle_id INTEGER REFERENCES parcelles(id),
  image_url TEXT,
  image_base64 TEXT,
  maladie_detectee VARCHAR(255),
  niveau_risque VARCHAR(50),
  conseil TEXT,
  ia_raw_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capteurs_releves (
  id SERIAL PRIMARY KEY,
  parcelle_id INTEGER REFERENCES parcelles(id),
  temperature DECIMAL(5,2),
  humidite DECIMAL(5,2),
  pluviometrie DECIMAL(6,2),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Seed utilisateur de démo
INSERT INTO users (email, password_hash, name) VALUES
  ('demo@parcell-ia.com', '$2b$10$demo_hash_placeholder', 'Agriculteur Demo')
ON CONFLICT DO NOTHING;

-- Seed parcelles fictives
INSERT INTO parcelles (user_id, name, surface_ha, culture, latitude, longitude) VALUES
  (1, 'Parcelle Nord', 12.5, 'Blé tendre', 48.8566, 2.3522),
  (1, 'Parcelle Sud', 8.2, 'Maïs', 48.8200, 2.4100),
  (1, 'Parcelle Est', 15.0, 'Colza', 48.8900, 2.4500)
ON CONFLICT DO NOTHING;

-- Seed diagnostics fictifs pour le dashboard
INSERT INTO diagnostics (user_id, parcelle_id, maladie_detectee, niveau_risque, conseil) VALUES
  (1, 1, 'Septoriose du blé', 'Élevé', 'Appliquer un fongicide à base de triazole dans les 48h.'),
  (1, 2, 'Mildiou', 'Modéré', 'Surveiller l''évolution, traitement préventif recommandé.'),
  (1, 1, 'Rouille brune', 'Faible', 'Situation sous contrôle, re-vérifier dans 7 jours.'),
  (1, 3, 'Aucune maladie détectée', 'Aucun', 'Parcelle en bonne santé, poursuivre la surveillance habituelle.'),
  (1, 2, 'Fusariose', 'Élevé', 'Traitement fongicide urgent, contacter votre technicien agricole.')
ON CONFLICT DO NOTHING;
