# Parcell-IA — Projet d'étude B2 SupDeVinci
## Groupe : Maxime · Jean-Marc · Antoine L · Rémi

Application mobile de diagnostic agricole par IA.

---

## Stack
- **Mobile** : React Native (Expo)
- **Backend** : Node.js + Express
- **BDD** : PostgreSQL
- **Infra** : Docker + Azure Container Apps
- **IA** : Azure OpenAI GPT-4o Vision

---

## Démarrage rapide

### Prérequis
- Docker + Docker Compose
- Node.js 20+
- Expo Go sur le téléphone

### 1. Cloner et configurer
```bash
git clone <repo>
cd projet-étude
cp .env.example .env
# Remplir les clés dans .env
```

### 2. Lancer le backend + base de données
```bash
docker compose up --build
```
- Backend dispo sur http://localhost:3000
- Test santé : http://localhost:3000/health

### 3. Lancer l'app mobile
```bash
cd mobile
npm install
npx expo start
```
Scanner le QR code avec Expo Go.

---

## Identifiants de démo
- Email : `demo@parcell-ia.com`
- Mot de passe : `demo123`

---

## Endpoints API principaux
| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/login` | Connexion |
| GET | `/diagnostics` | Liste diagnostics |
| POST | `/diagnostics` | Nouveau diagnostic (image_base64) |
| GET | `/parcelles` | Liste parcelles |

---

## Structure du projet
```
projet-étude/
├── backend/          # API Node.js/Express
│   └── src/
│       ├── routes/   # auth, diagnostics, parcelles
│       ├── services/ # aiProvider (Azure OpenAI)
│       ├── db/       # connexion PostgreSQL
│       └── middleware/
├── mobile/           # App React Native (Expo)
├── db/
│   └── init.sql      # Schéma + données seed
├── docker-compose.yml
└── .env.example
```

---

## URL de production
- App : [parcell-ia.com](https://parcell-ia.com)
- API : [api.parcell-ia.com](https://api.parcell-ia.com)
