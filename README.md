# Parcell-IA — Projet d'étude B2 SupDeVinci
## Groupe : Maxime · Jean-Marc · Antoine L · Rémi

Application mobile de diagnostic agricole par IA : photo d'une plante → analyse GPT-4o Vision → maladie détectée + niveau de risque + conseil agronomique.

---

## Stack

| Couche | Techno |
|---|---|
| Mobile | React Native (Expo) |
| Backend | Node.js + Express |
| Base de données | PostgreSQL 16 |
| Infra | Docker + Azure Container Apps |
| IA | Azure OpenAI GPT-4o Vision (fallback OpenAI direct, fallback mock) |

---

## Démarrage rapide

### Prérequis
- Docker + Docker Compose
- Node.js 20+
- Expo Go sur le téléphone

### 1. Cloner et configurer
```bash
git clone https://github.com/mlft9/projet-etude-2eme-annee.git
cd projet-etude-2eme-annee
cp .env.example .env
# Remplir les clés dans .env (voir section Variables d'environnement)
```

### 2. Lancer le backend
```bash
docker compose up --build -d
```
- Backend : http://localhost:3000
- Santé : http://localhost:3000/health

> **Profils disponibles :**
> ```bash
> # Avec DB PostgreSQL locale
> docker compose --profile local-db up --build -d
> # Avec Expo web (navigateur, port 8081)
> docker compose --profile mobile up --build -d
> ```

### 3. Lancer l'app mobile sur téléphone (Expo Go)

Le service Docker mobile tourne en mode web uniquement. Pour développer sur un vrai téléphone, lancer Expo **en local** :

```bash
cd mobile
npx expo install   # installe les dépendances Expo correctes
npx expo start
```
Scanner le QR code avec Expo Go. Le téléphone doit être sur le même réseau Wi-Fi que la machine.

> Vérifier que `src/config.js` pointe sur l'IP de ta machine (ex: `http://192.168.x.x:3000`).

---

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner :

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL complète |
| `DB_SSL` | `true` si Azure, `false` en local |
| `AZURE_OPENAI_ENDPOINT` | Endpoint Azure OpenAI |
| `AZURE_OPENAI_KEY` | Clé Azure OpenAI |
| `AZURE_OPENAI_DEPLOYMENT` | Nom du déploiement (ex: `gpt-4o`) |
| `OPENAI_API_KEY` | Clé OpenAI directe (fallback) |
| `JWT_SECRET` | Secret JWT (changer en prod) |

Si aucune clé IA n'est configurée, l'app bascule automatiquement sur une réponse mock.

---

## Identifiants de démo
- Email : `demo@parcell-ia.com`
- Mot de passe : `demo123`

---

## Endpoints API

Toutes les routes (sauf auth) nécessitent un header `Authorization: Bearer <token>`.

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Non | Connexion |
| POST | `/auth/register` | Non | Inscription |
| GET | `/parcelles` | Oui | Liste des parcelles de l'utilisateur |
| POST | `/parcelles` | Oui | Créer une parcelle (nom, culture, géométrie) |
| GET | `/diagnostics` | Oui | Liste des diagnostics de l'utilisateur |
| POST | `/diagnostics` | Oui | Lancer un diagnostic (image_base64 + parcelle_id) |
| GET | `/health` | Non | Santé du serveur |

---

## Structure du projet

```
projet-étude/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/          # login, register (controller, service, repo, dto, entity)
│       │   ├── diagnostics/   # diagnostic IA (controller, service, repo, dto, entity)
│       │   └── parcelles/     # gestion parcelles (controller, service, repo, dto, entity)
│       ├── providers/
│       │   └── ai.provider.js # Azure OpenAI / OpenAI / mock
│       ├── config/
│       │   └── database.js    # connexion Sequelize
│       ├── migrations/        # migrations Sequelize
│       └── container.js       # injection de dépendances
├── mobile/
│   └── src/
│       ├── features/
│       │   ├── auth/          # écrans login/register + hook useAuth
│       │   ├── dashboard/     # tableau de bord
│       │   ├── diagnostics/   # liste et création de diagnostics
│       │   ├── parcelles/     # carte Leaflet + gestion parcelles
│       │   └── account/       # profil et déconnexion
│       ├── shared/
│       │   ├── services/api.js # client HTTP centralisé
│       │   └── utils/         # geo, date
│       └── config.js          # API_BASE_URL
├── db/
│   └── init.sql               # schéma initial + seed
├── docker-compose.yml
└── .env.example
```
