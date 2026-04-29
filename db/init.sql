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
  geometry JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE parcelles ADD COLUMN IF NOT EXISTS geometry JSONB;

CREATE TABLE IF NOT EXISTS diagnostics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE SET NULL,
  image_url TEXT,
  image_base64 TEXT,
  maladie_detectee VARCHAR(255),
  niveau_risque VARCHAR(50),
  conseil TEXT,
  ia_raw_response TEXT,
  score_confiance INTEGER,
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

CREATE TABLE IF NOT EXISTS capteurs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  parcelle_id INTEGER REFERENCES parcelles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE capteurs_releves ADD COLUMN IF NOT EXISTS capteur_id INTEGER REFERENCES capteurs(id) ON DELETE SET NULL;

-- Seed utilisateur de démo
INSERT INTO users (email, password_hash, name) VALUES
  ('demo@parcell-ia.com', '$2b$10$demo_hash_placeholder', 'Agriculteur Demo')
ON CONFLICT DO NOTHING;

