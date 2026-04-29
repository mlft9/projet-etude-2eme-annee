# Parcell-IA - Documentation du projet

**Projet Bachelor 2 - SupDeVinci**
**Theme : IA & Agriculture**
**Domaine : parcell-ia.com**

---

## Table des matieres

1. [Presentation du projet](#1-presentation-du-projet)
2. [Equipe](#2-equipe)
3. [Architecture technique](#3-architecture-technique)
4. [Structure du projet](#4-structure-du-projet)
5. [Installation et demarrage](#5-installation-et-demarrage)
6. [API Backend](#6-api-backend)
7. [Application mobile](#7-application-mobile)
8. [Intelligence artificielle](#8-intelligence-artificielle)
9. [Base de donnees](#9-base-de-donnees)
10. [Capteurs IoT](#10-capteurs-iot)
11. [Deploiement](#11-deploiement)
12. [Analyse financiere](#12-analyse-financiere)

---

## 1. Presentation du projet

Parcell-IA est une application mobile de diagnostic de maladies agricoles par analyse photo. L'agriculteur photographie une plante ou une feuille depuis son smartphone. L'image est envoyee a un backend qui interroge un modele de vision par IA (Azure OpenAI GPT-4o Vision) et retourne un diagnostic structure : nom de la maladie detectee, niveau de risque, conseil actionnable et score de confiance.

Le diagnostic peut etre affine en integrant les donnees de capteurs terrain (temperature du sol, humidite, pluviometrie) associes a la parcelle concernee.

L'application propose egalement une bibliotheque de plantes cultivees avec fiche maladies, nuisibles et besoins, ainsi qu'un assistant IA permettant de poser des questions agronomiques libres sur une plante.

![Capture ecran - ecran d'accueil de l'application](../assets/accueil.png)

---

## 2. Equipe

| Membre | Role |
|---|---|
| Maxime | Tech lead - architecture, backend, mobile, DevOps |
| Jean-Marc | Backend & cloud Azure |
| Antoine L | Contenu, slides et presentation |
| Remi | Documentation et architecture |

---

## 3. Architecture technique

### Stack

| Couche | Technologie |
|---|---|
| Application mobile | React Native (Expo) |
| Backend API | Node.js / Express |
| Base de donnees | PostgreSQL 16 |
| ORM | Sequelize |
| IA vision | Azure OpenAI GPT-4o Vision |
| Containerisation | Docker + Docker Compose |
| Hebergement | Azure Container Apps |
| Base de donnees cloud | Azure PostgreSQL Flexible Server |

### Vue d'ensemble de l'architecture

![Schema d'architecture applicative](./technique/schema/applicative.png)

![Schema d'infrastructure](./technique/schema/infra.png)

![Schema applicatif](./technique/schema/applicative.png)


### Flux principal

1. L'utilisateur prend une photo depuis l'app mobile
2. L'image est encodee en base64 et envoyee a l'API backend via HTTPS
3. Le backend transmet l'image a Azure OpenAI GPT-4o Vision avec un prompt agronome
4. La reponse JSON est parsee, persistee en base et renvoyee au mobile
5. Si des capteurs sont associes a la parcelle, un second appel IA integre les donnees terrain pour affiner le diagnostic

---

## 4. Structure du projet

```
parcell-ia/
- backend/               # API Node.js / Express
  - src/
    - config/            # Configuration base de donnees
    - middleware/        # Authentification JWT
    - migrations/        # Migrations Sequelize
    - models/            # Modeles ORM
    - modules/           # Modules metier (auth, parcelles, diagnostics, capteurs)
    - providers/         # Provider IA (Azure OpenAI / OpenAI / mock)
    - scripts/           # Simulateur IoT
    - seeders/           # Donnees de demo
  - Dockerfile
- mobile/                # Application React Native / Expo
  - src/
    - features/          # Modules fonctionnels
      - auth/            # Authentification
      - dashboard/       # Tableau de bord
      - diagnostics/     # Diagnostic photo IA
      - parcelles/       # Gestion des parcelles
      - plants/          # Bibliotheque des plantes
      - account/         # Compte utilisateur
    - shared/            # Services, utils, donnees partagees
- db/                    # Script SQL d'initialisation
- docs/                  # Documentation
- schema/                # Schemas et diagrammes
- docker-compose.yml
- .env.example
```

---

## 5. Installation et demarrage

### Prerequis

- Docker et Docker Compose installes
- Node.js >= 18 (pour le developpement local sans Docker)
- Un compte Azure OpenAI ou une cle API OpenAI

### Configuration de l'environnement

Copier le fichier `.env.example` en `.env` et renseigner les variables :

```bash
cp .env.example .env
```

Variables a configurer :

```env
# Base de donnees
POSTGRES_DB=parcell_ia
POSTGRES_USER=parcell
POSTGRES_PASSWORD=parcell_secret

# Backend
JWT_SECRET=change_me_in_production

# IA - Azure OpenAI (priorite 1)
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_KEY=<cle_azure>
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# IA - OpenAI direct (fallback)
OPENAI_API_KEY=<cle_openai>
```

### Demarrage avec Docker Compose

```bash
# Demarrer la base de donnees et le backend
docker compose up -d

# Verifier que les services sont actifs
docker compose ps

# Consulter les logs du backend
docker compose logs -f backend
```

L'API est accessible sur `http://localhost:3000`.

Le endpoint de sante est disponible sur `http://localhost:3000/health`.

### Demarrer le simulateur IoT (optionnel)

```bash
cd backend
npm run iot
```

Le simulateur insere des releves de capteurs toutes les 10 a 30 secondes pour les capteurs associes a une parcelle.

---

## 6. API Backend

L'API est construite avec Express et expose quatre modules de routes. Toutes les routes (sauf `POST /auth/login` et `POST /auth/register`) necessitent un token JWT valide dans le header `Authorization: Bearer <token>`.

### Authentification - /auth

| Methode | Route | Description |
|---|---|---|
| POST | /auth/register | Creer un compte utilisateur |
| POST | /auth/login | Se connecter, obtenir un JWT |

### Parcelles - /parcelles

| Methode | Route | Description |
|---|---|---|
| GET | /parcelles | Lister toutes les parcelles de l'utilisateur |
| POST | /parcelles | Creer une nouvelle parcelle |
| PUT | /parcelles/:id | Modifier une parcelle |
| DELETE | /parcelles/:id | Supprimer une parcelle |
| GET | /parcelles/:id/capteurs | Lister les capteurs de la parcelle |
| GET | /parcelles/:id/capteurs/latest | Obtenir le dernier releve des capteurs |

### Diagnostics - /diagnostics

| Methode | Route | Description |
|---|---|---|
| GET | /diagnostics | Lister l'historique des diagnostics |
| POST | /diagnostics | Lancer un diagnostic photo IA |
| POST | /diagnostics/:id/affiner | Affiner le diagnostic avec les donnees capteurs |
| POST | /diagnostics/:id/alert | Envoyer une alerte sur le diagnostic |
| POST | /diagnostics/plantes/assistant | Poser une question IA sur une plante |

### Capteurs - /capteurs

| Methode | Route | Description |
|---|---|---|
| GET | /capteurs | Lister les capteurs |
| POST | /capteurs | Creer un capteur |
| DELETE | /capteurs/:id | Supprimer un capteur |
| PATCH | /capteurs/:id/parcelle | Associer un capteur a une parcelle |

---

## 7. Application mobile

L'application est developpee avec React Native et Expo. Elle est organisee par modules fonctionnels (features).

### Ecrans et navigation

#### Authentification

- **AuthScreen** - Formulaire de connexion / inscription. Stocke le token JWT en local.

![Capture - ecran de connexion](../assets/login.png)

#### Tableau de bord

- **DashboardScreen** - Vue principale apres connexion. Affiche trois statistiques (nombre de parcelles, nombre de diagnostics, nombre de diagnostics a risque eleve), la liste des parcelles avec coordonnees GPS, et les quatre derniers diagnostics.

#### Diagnostics

- **DiagnosticsScreen** - Historique complet des diagnostics avec badge de niveau de risque.
- **NewDiagnosticScreen** - Lancement d'un diagnostic. L'utilisateur selectionne une parcelle parmi les siennes, prend une photo (camera ou galerie) et envoie l'image pour analyse.
- **DiagnosticResultScreen** - Affichage du resultat IA : maladie detectee, niveau de risque, conseil, score de confiance.
- **DiagnosticDetailScreen** - Detail complet d'un diagnostic existant.
- **RefinementScreen** - Affinage du diagnostic avec les donnees des capteurs terrain associes a la parcelle.

![Capture - ecran de diagnostic](../assets/diag.png)

#### Parcelles

- **MapScreen** - Carte des parcelles geographiques.

#### Bibliotheque des plantes

- **PlantLibraryScreen** - Catalogue des cultures disponibles (maladies, nuisibles, varietes). Si une culture est liee a une parcelle selectionnee, la fiche correspondante est mise en avant.
- **PlantDetailsScreen** - Fiche detaillee d'une plante avec la possibilite de poser une question libre a l'assistant IA agronome.

![Capture - bibliotheque des plantes](../assets/plante.png)

#### Compte

- **AccountScreen** - Informations du compte et deconnexion.

---

## 8. Intelligence artificielle

### Provider IA

Le fichier `backend/src/providers/ai.provider.js` centralise toutes les interactions avec l'IA. Il detecte automatiquement la configuration disponible au demarrage :

1. **Azure OpenAI** (priorite) - utilise si `AZURE_OPENAI_KEY` et `AZURE_OPENAI_ENDPOINT` sont renseignes
2. **OpenAI direct** (fallback) - utilise si seul `OPENAI_API_KEY` est present
3. **Mode mock** - retourne des reponses fictives coherentes si aucune cle n'est configuree

Ce mecanisme permet de developper et de demontrer l'application sans cle IA valide.

### Fonctionnalites IA

#### Diagnostic photo

Le prompt systeme positionne le modele en tant qu'expert agronome. Il analyse l'image et repond en JSON strict :

```json
{
  "maladie": "nom de la maladie ou 'Aucune maladie detectee'",
  "niveau_risque": "Aucun | Faible | Modere | Eleve",
  "conseil": "conseil court et actionnable pour l'agriculteur",
  "score_confiance": 85
}
```

#### Diagnostic affine avec capteurs

Un second appel IA integre les donnees terrain au contexte de l'image :

- Temperature du sol (°C)
- Humidite du sol (%)
- Pluviometrie recente (mm)

Le modele recalcule le diagnostic avec un score de confiance generalement plus eleve.

#### Assistant plante

L'utilisateur peut poser une question libre sur une plante. La reponse est structuree en quatre sections :

- Resume
- Conseils
- Points de vigilance
- Prochaines actions

![Schema du flux IA](./technique/schema/diagramme%20sequence.png)

### Modele utilise

- Modele : GPT-4o (capacite vision)
- Limite de tokens : 300 pour le diagnostic photo, 450 pour l'assistant plante
- Format de sortie : JSON strict parse cote backend

---

## 9. Base de donnees

### Modele de donnees

![Modele de donnees](./technique/schema/modele%20de%20données.png)

![Schema logique](./technique/schema/logique.png)

### Tables

#### users

| Colonne | Type | Description |
|---|---|---|
| id | INTEGER | Cle primaire, auto-increment |
| email | VARCHAR(255) | Email unique |
| password_hash | VARCHAR(255) | Mot de passe hache (bcrypt) |
| name | VARCHAR(255) | Nom affiche |
| created_at | TIMESTAMP | Date de creation |

#### parcelles

| Colonne | Type | Description |
|---|---|---|
| id | INTEGER | Cle primaire |
| user_id | INTEGER | Cle etrangere vers users |
| name | VARCHAR(255) | Nom de la parcelle |
| surface_ha | DECIMAL(8,2) | Surface en hectares |
| culture | VARCHAR(255) | Type de culture |
| latitude | DECIMAL(10,7) | Coordonnee GPS latitude |
| longitude | DECIMAL(10,7) | Coordonnee GPS longitude |
| geometry | JSONB | Geometrie GeoJSON (optionnel) |
| created_at | TIMESTAMP | Date de creation |

#### diagnostics

| Colonne | Type | Description |
|---|---|---|
| id | INTEGER | Cle primaire |
| user_id | INTEGER | Cle etrangere vers users |
| parcelle_id | INTEGER | Cle etrangere vers parcelles |
| image_base64 | TEXT | Image encodee en base64 |
| maladie_detectee | VARCHAR(255) | Nom de la maladie |
| niveau_risque | VARCHAR(50) | Aucun / Faible / Modere / Eleve |
| conseil | TEXT | Conseil de l'IA |
| score_confiance | INTEGER | Score 0-100 |
| ia_raw_response | TEXT | Reponse brute de l'IA |
| created_at | TIMESTAMP | Date du diagnostic |

#### capteurs

| Colonne | Type | Description |
|---|---|---|
| id | INTEGER | Cle primaire |
| user_id | INTEGER | Cle etrangere vers users |
| parcelle_id | INTEGER | Cle etrangere vers parcelles |
| label | VARCHAR(255) | Nom du capteur |

#### capteurs_releves

| Colonne | Type | Description |
|---|---|---|
| id | INTEGER | Cle primaire |
| capteur_id | INTEGER | Cle etrangere vers capteurs |
| parcelle_id | INTEGER | Cle etrangere vers parcelles |
| temperature | DECIMAL | Temperature sol (°C) |
| humidite | DECIMAL | Humidite sol (%) |
| pluviometrie | DECIMAL | Pluviometrie (mm) |
| timestamp | TIMESTAMP | Horodatage du releve |

---

## 10. Capteurs IoT

### Simulateur

Le script `backend/src/scripts/iotSimulator.js` simule un parc de capteurs terrain. Il interroge la base de donnees toutes les 10 a 30 secondes pour recuperer la liste des capteurs associes a une parcelle, puis insere un releve aleatoire coherent pour chacun :

- Temperature : 10 a 35°C
- Humidite : 30 a 90%
- Pluviometrie : 0 a 20 mm

Ce composant peut etre remplace par une integration reelle (MQTT, API capteurs physiques) sans modifier le reste du code.

### Diagramme d'activite

![Diagramme d'activite](./technique/schema/diagramme%20activié.png)

---

## 11. Deploiement

### Architecture de deploiement

![Schema de deploiement](./technique/schema/déploiement.png)

### Services Azure

| Service | Role |
|---|---|
| Azure Container Apps | Hebergement du backend (conteneur Docker) |
| Azure PostgreSQL Flexible Server | Base de donnees de production |
| Azure OpenAI | Modele GPT-4o Vision pour l'IA |

### Variables d'environnement de production

En production, les variables suivantes doivent etre configurees :

```env
DATABASE_URL=postgresql://user:password@host:5432/parcell_ia
DB_SSL=true
JWT_SECRET=<secret_fort_aleatoire>
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_KEY=<cle_azure>
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### URLs de production

- Application : parcell-ia.com
- API : api.parcell-ia.com

---

## 12. Analyse financiere

### Investissement initial

| Poste | Montant |
|---|---|
| Developpement (4 personnes x 18h x 50 €/h) | 3 600 € |
| Domaine parcell-ia.com | 15 € |
| **Total** | **3 615 €** |

### Couts infrastructure mensuels

| Service | Cout mensuel |
|---|---|
| Azure Container Apps | ~30 € |
| Azure PostgreSQL Flexible Server | ~15 € |
| Azure OpenAI GPT-4o Vision (~500 diagnostics) | ~5 € |
| **Total** | **~50 €/mois** |

### Modele de revenus

- Abonnement SaaS B2B : 29 €/mois par exploitation
- Seuil de rentabilite : 2 exploitations abonnees

| Scenario | Exploitations | Revenus annuels |
|---|---|---|
| M6 | 10 | 3 480 € |
| M12 | 50 | 17 400 € |
| M18 | 100 | 34 800 € |

### Retour sur investissement

**ROI editeur (annee 1)**
- Couts totaux : 4 215 € (dev + infra)
- Revenus estimes : ~17 400 € (50 exploitations a partir de M6)
- ROI : +313 %

**ROI agriculteur**
- Economie traitement cible vs preventif : ~40 €/ha, soit 4 000 €/an sur 100 ha
- Cout abonnement : 348 €/an
- ROI : x11,5

Note : les maladies fongiques representent 15 a 20 % de pertes de recoltes en France. Le diagnostic precoce permet un traitement cible et reduit significativement ces pertes.