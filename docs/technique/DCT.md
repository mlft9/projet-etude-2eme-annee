# DCT — Dossier de Conception Technique

## 1. Modèle de données

### Schéma relationnel

```
users
├── id           SERIAL PK
├── email        VARCHAR(255) UNIQUE NOT NULL
├── password_hash VARCHAR(255) NOT NULL
├── name         VARCHAR(255)
└── created_at   TIMESTAMP

parcelles
├── id           SERIAL PK
├── user_id      FK → users.id
├── name         VARCHAR(255) NOT NULL
├── surface_ha   DECIMAL(8,2)
├── culture      VARCHAR(255)
├── latitude     DECIMAL(10,7)
├── longitude    DECIMAL(10,7)
└── created_at   TIMESTAMP

diagnostics
├── id                SERIAL PK
├── user_id           FK → users.id
├── parcelle_id       FK → parcelles.id (nullable)
├── image_base64      TEXT
├── maladie_detectee  VARCHAR(255)
├── niveau_risque     VARCHAR(50)   -- Aucun | Faible | Modéré | Élevé
├── conseil           TEXT
├── ia_raw_response   TEXT
└── created_at        TIMESTAMP

capteurs_releves
├── id            SERIAL PK
├── parcelle_id   FK → parcelles.id
├── temperature   DECIMAL(5,2)
├── humidite      DECIMAL(5,2)
├── pluviometrie  DECIMAL(6,2)
└── timestamp     TIMESTAMP
```

**Règles métier :**
- Un diagnostic peut être rattaché à une parcelle ou non (l'agriculteur peut photographier sans sélectionner de parcelle).
- `niveau_risque` est contraint à 4 valeurs : Aucun, Faible, Modéré, Élevé.
- Les images ne sont pas stockées sur disque — seul le base64 est conservé en BDD pour la traçabilité.

---

## 2. API REST

Base URL : `https://api.parcell-ia.com`  
Format : JSON. Authentification : `Authorization: Bearer <token>` sur les routes protégées.

### 2.1 Authentification

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Création de compte |
| POST | `/auth/login` | Connexion, retourne un JWT |

**POST /auth/register**
```json
// Body
{ "email": "user@example.com", "password": "motdepasse", "name": "Jean" }

// Réponse 201
{ "token": "<jwt>", "user": { "id": 1, "email": "...", "name": "Jean" } }
```

**POST /auth/login**
```json
// Body
{ "email": "user@example.com", "password": "motdepasse" }

// Réponse 200
{ "token": "<jwt>", "user": { "id": 1, "email": "...", "name": "Jean" } }
```

---

### 2.2 Parcelles

| Méthode | Route | Description |
|---|---|---|
| GET | `/parcelles` | Liste les parcelles de l'utilisateur |
| POST | `/parcelles` | Crée une parcelle |
| GET | `/parcelles/:id` | Détail d'une parcelle |
| PUT | `/parcelles/:id` | Mise à jour |
| DELETE | `/parcelles/:id` | Suppression |

**POST /parcelles**
```json
// Body
{ "name": "Parcelle Nord", "surface_ha": 12.5, "culture": "Blé tendre",
  "latitude": 48.8566, "longitude": 2.3522 }

// Réponse 201
{ "id": 1, "name": "Parcelle Nord", ... }
```

---

### 2.3 Diagnostics

| Méthode | Route | Description |
|---|---|---|
| GET | `/diagnostics` | Historique des diagnostics de l'utilisateur |
| POST | `/diagnostics` | Lance un diagnostic IA sur une image |

**POST /diagnostics** — c'est la route centrale de l'application.

```json
// Body
{ "parcelle_id": 1, "image_base64": "<image jpeg encodée en base64>" }

// Réponse 201
{
  "id": 42,
  "maladie_detectee": "Septoriose du blé",
  "niveau_risque": "Élevé",
  "conseil": "Appliquer un fongicide à base de triazole dans les 48h.",
  "created_at": "2026-04-27T10:00:00Z"
}
```

**GET /health** (non protégé) — sonde de disponibilité.
```json
{ "status": "ok", "project": "parcell-ia" }
```

---

## 3. Conception du service IA

### Flux d'un diagnostic

```
Mobile                Backend              Azure OpenAI
  │                      │                     │
  │── POST /diagnostics ─►│                     │
  │   { image_base64 }    │                     │
  │                       │── chat.completions ─►│
  │                       │   [prompt + image]   │
  │                       │                     │
  │                       │◄── JSON réponse ────│
  │                       │   { maladie,        │
  │                       │     niveau_risque,  │
  │                       │     conseil }       │
  │                       │                     │
  │                       │── INSERT diagnostics│
  │                       │   (PostgreSQL)      │
  │◄── 201 diagnostic ───│                     │
```

### Prompt système envoyé à GPT-4o

```
Tu es un expert agronome. Analyse cette photo de plante/feuille
et réponds en JSON strict :
{
  "maladie": "nom de la maladie ou 'Aucune maladie détectée'",
  "niveau_risque": "Aucun | Faible | Modéré | Élevé",
  "conseil": "conseil court et actionnable pour l'agriculteur"
}
```

Le backend parse la réponse JSON, strip les éventuels blocs markdown (` ```json `) et persiste le résultat. La réponse brute (`ia_raw_response`) est conservée pour débogage.

---

## 4. Authentification

### Flux de connexion

1. L'utilisateur soumet email + mot de passe.
2. Le backend vérifie le hash bcrypt en base (coût 10).
3. Si valide : génération d'un JWT signé (`JWT_SECRET`, expiration 7 jours).
4. Le token est stocké côté mobile via `SecureStore` (Expo).
5. Chaque requête protégée inclut `Authorization: Bearer <token>`.
6. Le middleware `auth.js` vérifie la signature et injecte `req.user`.

---

## 5. Gestion des erreurs

| Situation | Code HTTP | Message |
|---|---|---|
| Champs manquants | 400 | `"image_base64 requis"` |
| Token absent/invalide | 401 | `"Token invalide"` |
| Ressource introuvable | 404 | `"Not found"` |
| Erreur IA (timeout…) | 500 | `{ "error": "..." }` |
| Erreur BDD | 500 | `{ "error": "..." }` |

Les erreurs 500 exposent le message d'erreur brut en développement. En production, prévoir un message générique.

---

## 6. Conventions de développement

| Sujet | Convention |
|---|---|
| Branches | `main` (démo), `feat/<nom>` pour les développements |
| Revue de code | Aucun merge sur `main` sans review Maxime |
| Variables d'env | `.env` local, jamais versionné |
| Format image | JPEG, max 10 MB (limité par Express `json limit`) |
| Timezone | UTC en base, conversion locale côté mobile |
