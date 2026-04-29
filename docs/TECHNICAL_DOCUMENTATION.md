# Parcell-IA — Documentation technique complète

Ce document explique le projet Parcell-IA de manière simple et progressive. L’objectif est qu’une personne qui découvre le projet puisse comprendre:

---

## 5. Organisation du projet

### 5.1 Backend

Le backend est organisé en couches pour séparer clairement les responsabilités.

- `backend/src/modules/auth` gère l’inscription et la connexion.
- `backend/src/modules/parcelles` gère les parcelles.
- `backend/src/modules/diagnostics` gère les diagnostics.
- `backend/src/providers/ai.provider.js` encapsule l’appel à l’IA.
- `backend/src/models` contient les modèles de données.
- `backend/src/middleware/auth.js` vérifie les jetons JWT.

Cette organisation évite de mélanger l’accès à la base de données, la logique métier et les réponses HTTP.

### 5.2 Mobile

Le mobile est organisé par fonctionnalité.

- `mobile/src/features/auth` contient la connexion et l’inscription.
- `mobile/src/features/dashboard` contient l’écran d’accueil.
- `mobile/src/features/diagnostics` contient la liste des diagnostics et la création d’un nouveau diagnostic.
- `mobile/src/features/parcelles` contient la carte et les éléments liés aux parcelles.
- `mobile/src/features/account` contient le compte utilisateur.
- `mobile/src/shared/services/api.js` contient les appels réseau vers le backend.
- `mobile/src/config.js` calcule l’URL du backend selon l’environnement.

---

## 6. Parcours utilisateur détaillé

### 6.1 Connexion et inscription

L’application commence par vérifier si une session existe déjà.

Le comportement observé dans le code est le suivant:

- au démarrage, l’application tente de restaurer la session depuis le stockage local,
- si une session valide est trouvée, l’utilisateur accède directement à l’application,
- sinon, l’écran d’authentification est affiché.

L’inscription et la connexion passent par le backend. Le backend renvoie un token JWT et les informations du compte. Le mobile sauvegarde ensuite ces informations dans le stockage local afin d’éviter à l’utilisateur de se reconnecter à chaque ouverture.

### 6.2 Tableau de bord

Le tableau de bord présente une vue synthétique.

Il affiche par exemple:

- le nom de l’utilisateur,
- les parcelles disponibles,
- les diagnostics récents,
- des accès rapides pour naviguer vers les autres écrans.

### 6.3 Parcelles

La partie parcelles permet de visualiser et consulter les parcelles enregistrées.

Le backend expose uniquement deux opérations:

- lire la liste des parcelles de l’utilisateur,
- créer une nouvelle parcelle.

### 6.4 Création d’un diagnostic

Le diagnostic est le cœur du projet.

Quand l’utilisateur lance une analyse:

1. il sélectionne ou confirme une parcelle,
2. il fournit une image,
3. l’application envoie la requête au backend,
4. le backend appelle l’IA,
5. le résultat est enregistré,
6. le mobile recharge les données,
7. le diagnostic apparaît dans l’historique.

### 6.5 Compte utilisateur

L’écran compte permet surtout de consulter les informations de session et de se déconnecter.

---

## 7. API backend

Toutes les routes protégées utilisent un en-tête:

```text
Authorization: Bearer <token>
```

### 7.1 Routes d’authentification

- `POST /auth/login`
- `POST /auth/register`

Ces routes ne nécessitent pas de jeton JWT.

### 7.2 Routes des parcelles

- `GET /parcelles`
- `POST /parcelles`

Ces routes nécessitent un jeton JWT valide.

### 7.3 Routes des diagnostics

- `GET /diagnostics`
- `POST /diagnostics`

Ces routes nécessitent aussi un jeton JWT valide.

### 7.4 Route de santé

- `GET /health`

Cette route permet de vérifier que le serveur répond.

### 7.5 Règle générale des réponses

Le backend renvoie des réponses JSON. En cas d’erreur, la réponse contient un message lisible par le client.

Exemples de cas gérés:

- token manquant,
- token invalide,
- données incomplètes,
- erreur IA,
- erreur base de données.

---

## 8. Modèle de données

La base est organisée autour de quatre tables principales.

### 8.1 Users

Contient les comptes utilisateurs.

Champs importants:

- identifiant,
- email,
- mot de passe haché,
- nom,
- date de création.

### 8.2 Parcelles

Contient les parcelles créées par un utilisateur.

Champs importants:

- identifiant,
- propriétaire,
- nom,
- surface,
- culture,
- latitude,
- longitude.

### 8.3 Diagnostics

Contient l’historique des analyses d’images.

Champs importants:

- identifiant,
- utilisateur,
- parcelle associée ou non,
- image encodée,
- maladie détectée,
- niveau de risque,
- conseil,
- réponse brute de l’IA,
- date de création.

### 8.4 Capteurs et relevés

Contient des mesures techniques liées à une parcelle.

Exemples de données:

- température,
- humidité,
- pluviométrie,
- horodatage.

### 8.5 Relations entre les données

Le modèle relationnel est conçu pour qu’un utilisateur puisse avoir plusieurs parcelles, et qu’une parcelle puisse être liée à plusieurs diagnostics et relevés.

Le backend définit ces relations dans `backend/src/models/index.js`.

---

## 9. Sécurité et authentification

### 9.1 Pourquoi JWT

JWT signifie JSON Web Token. C’est un petit jeton signé qui permet au backend de vérifier qu’une requête vient bien d’un utilisateur connecté.

Dans ce projet, le token est utilisé pour protéger les routes métier.

### 9.2 Mot de passe

Les mots de passe ne sont pas stockés en clair.

Ils sont hachés avec bcrypt avant d’être enregistrés en base de données.

### 9.3 Stockage côté mobile

Le mobile enregistre la session dans le stockage local de l’application afin d’éviter une reconnexion à chaque lancement.

### 9.4 Variables sensibles

Les secrets et identifiants sensibles sont fournis via des variables d’environnement, jamais codés en dur.

Exemples:

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`

---

## 10. Intelligence artificielle

### 10.1 Rôle de l’IA

L’IA analyse l’image envoyée par l’utilisateur et fournit une estimation utile pour orienter l’action de l’agriculteur.

### 10.2 Format attendu

L’IA doit répondre avec trois éléments:

- `maladie`
- `niveau_risque`
- `conseil`

### 10.3 Fallback

Si l’IA ne peut pas être appelée correctement, le projet revient sur une réponse de secours simple pour garder la démo exploitable.

Cela évite de bloquer complètement l’expérience utilisateur en cas de problème de configuration.

---

## 11. Installation et lancement en local

### 11.1 Prérequis

Avant de lancer le projet, il faut disposer de:

- Docker et Docker Compose,
- Node.js 20 ou plus,
- un environnement Expo installé sur la machine mobile ou un navigateur web si nécessaire.

### 11.2 Lancer la base et le backend

Depuis la racine du projet:

```powershell
Set-Location "D:\Projet_Etude\projet-etude-2eme-annee"
docker compose --profile local-db up --build -d
```

Si vous souhaitez uniquement utiliser un backend déjà relié à une base distante, la configuration peut être adaptée via `DATABASE_URL` dans le fichier `.env`.

### 11.3 Lancer le mobile

Depuis le dossier `mobile`:

```powershell
Set-Location "D:\Projet_Etude\projet-etude-2eme-annee\mobile"
npx expo start
```

Si vous préférez utiliser la racine du projet:

```powershell
npx --prefix mobile expo start
```

### 11.4 Ce que fait le mobile au démarrage

Le mobile calcule automatiquement l’URL du backend.

En développement Expo Go, il récupère l’adresse IP de la machine de développement et construit une URL du type:

```text
http://<ip-de-la-machine>:3000
```

Cette logique se trouve dans `mobile/src/config.js`.

---

## 12. Conteneurs Docker

Le projet contient un fichier `docker-compose.yml` qui permet de lancer plusieurs services ensemble.

Services présents:

- `db` pour PostgreSQL,
- `backend` pour l’API,
- `mobile` pour l’interface mobile/web.

Cette organisation sert à reproduire localement une architecture proche de celle de production.

Le lancement du mobile en conteneur est prévu pour les usages web ou de démonstration. Pour un téléphone réel, il est plus simple d’exécuter Expo directement dans le dossier `mobile`.

Commandes utiles:

```powershell
Set-Location "D:\Projet_Etude\projet-etude-2eme-annee"
docker compose --profile local-db up --build -d
docker compose --profile local-db --profile mobile up --build -d
```

---

## 13. Déploiement et exécution en production

Le projet a été conçu pour être déployé dans un environnement Azure.

En pratique, cela signifie:

- l’API backend est publiée sur un service conteneurisé,
- la base de données est disponible sur PostgreSQL,
- l’IA peut utiliser Azure OpenAI si la configuration est fournie,
- les secrets restent hors du code source.

En production, il faut vérifier avec soin:

- les variables d’environnement,
- le certificat HTTPS,
- le nom de domaine ou l’URL publique,
- la connexion entre l’application mobile et le backend,
- les droits d’accès à la base de données.

---

## 14. Dépannage rapide

Voici les problèmes les plus probables et leur sens:

- `no configuration file provided`: la commande Docker a été lancée dans le mauvais dossier.
- `package.json does not exist`: `npx expo start` a été lancé hors du dossier `mobile`.
- `module expo is not installed`: les dépendances du mobile ne sont pas installées.
- `Token invalide`: la session utilisateur n’est plus valide ou a été supprimée.
- erreur IA: aucune clé n’est disponible ou l’API distante ne répond pas.

Si le mobile ne trouve pas le backend, vérifier que:

- le backend est démarré,
- le port 3000 est bien accessible,
- l’adresse IP utilisée par Expo est correcte,
- le téléphone est sur le même réseau que la machine de développement.

---

## 15. Glossaire simple

- **Backend**: serveur qui traite les données et exécute les règles métier.
- **Base de données**: espace de stockage structuré pour les informations du projet.
- **API**: interface qui permet à une application d’en appeler une autre.
- **JWT**: jeton signé qui prouve qu’un utilisateur est connecté.
- **Expo**: outil qui simplifie le développement d’applications React Native.
- **PostgreSQL**: système de base de données relationnelle.
- **IA**: intelligence artificielle utilisée pour analyser une image.
- **Fallback**: solution de secours quand le service principal ne peut pas être utilisé.
- **Docker**: outil de conteneurisation qui facilite le lancement des services.

---

## 16. Fichiers à retenir

Si vous devez reprendre le projet, commencez par ces fichiers:

- `README.md` pour le démarrage,
- `docker-compose.yml` pour le lancement des services,
- `backend/src/index.js` pour le démarrage du serveur,
- `backend/src/app.js` pour les routes HTTP,
- `backend/src/container.js` pour l’assemblage des services,
- `backend/src/models/index.js` pour les relations entre données,
- `backend/src/providers/ai.provider.js` pour l’appel IA,
- `backend/src/middleware/auth.js` pour la sécurité,
- `mobile/App.js` pour la navigation du mobile,
- `mobile/src/shared/services/api.js` pour les appels vers le backend,
- `mobile/src/features/auth/hooks/useAuth.js` pour la session,
- `mobile/src/config.js` pour l’URL du backend.

---

## 17. Génération du PDF

Pour transformer ce document en PDF, la solution la plus simple reste `pandoc`.

Si `pandoc` est installé:

```powershell
Set-Location "D:\Projet_Etude\projet-etude-2eme-annee"
pandoc -s docs/TECHNICAL_DOCUMENTATION.md -o docs/Parcell-IA-Technical-Documentation.pdf --metadata title="Parcell-IA — Documentation technique complète"
```

Si `pandoc` n’est pas installé, il faudra passer par une autre solution de conversion Markdown vers PDF.

---

## 18. Résumé final

Parcell-IA est une application pensée pour rester simple à comprendre et à utiliser.

Le mobile sert à l’utilisateur final, le backend fait le travail principal de traitement, la base de données conserve les informations, et l’IA fournit une analyse rapide à partir d’une image.

Pour une reprise du projet par une autre personne, la combinaison la plus utile est:

1. lire le README,
2. lire cette documentation,
3. parcourir les fichiers listés dans la section précédente,
4. lancer le projet en local,
5. observer le flux complet entre mobile, backend, base de données et IA.

Cette logique est définie dans `mobile/src/config.js`.

---

## 12. Conteneurs Docker

Le fichier `docker-compose.yml` orchestre trois services:

- `db` pour PostgreSQL,
- `backend` pour l’API,
- `mobile` pour l’interface mobile/web.

Le service mobile est activé via le profil `mobile`.

Exemples utiles:

```powershell
Set-Location "D:\Projet_Etude\projet-etude-2eme-annee"
docker compose --profile local-db up --build -d
docker compose --profile local-db --profile mobile up --build -d
```

---

## 13. Déploiement

Le projet est pensé pour être déployé dans un environnement Azure.

Le scénario prévu dans la documentation d’origine est le suivant:

- backend dans Azure Container Apps,
- base de données PostgreSQL dans une instance gérée ou un composant équivalent,
- IA via Azure OpenAI,
- exposition HTTPS publique.

Le déploiement de production n’est pas simplement une copie du mode local. Il faut vérifier:

- les variables d’environnement,
- l’accès réseau entre les services,
- la sécurité des secrets,
- le bon fonctionnement de l’URL du backend,
- la présence des migrations ou du schéma initial.

---

## 14. Fichiers importants à connaître

Voici les fichiers les plus utiles pour comprendre le projet:

- `README.md` : vue générale et démarrage rapide,
- `docker-compose.yml` : orchestration des services,
- `backend/src/index.js` : démarrage du backend,
- `backend/src/app.js` : configuration Express,
- `backend/src/container.js` : assemblage des services,
- `backend/src/models/index.js` : relations entre modèles,
- `backend/src/providers/ai.provider.js` : appel à l’IA,
- `backend/src/middleware/auth.js` : contrôle du token,
- `mobile/App.js` : navigation principale du mobile,
- `mobile/src/shared/services/api.js` : client HTTP,
- `mobile/src/features/auth/hooks/useAuth.js` : gestion de session,
- `mobile/src/config.js` : URL du backend.

---

## 15. Limites actuelles et points à améliorer

La documentation actuelle du code montre plusieurs améliorations possibles:

- améliorer les messages d’erreur utilisateur,
- enrichir les diagrammes d’architecture,
- ajouter des captures d’écran du mobile,
- documenter chaque écran avec ses entrées et sorties,
- ajouter un exemple de réponse pour chaque endpoint,
- préciser le format exact de certains objets JSON.

Ces améliorations ne bloquent pas le fonctionnement du projet, mais elles rendent le projet plus facile à reprendre par une autre personne.

---

## 16. Glossaire simple

- **Backend**: partie serveur qui traite les données et les règles métier.
- **Base de données**: système qui conserve les informations de manière structurée.
- **JWT**: jeton qui prouve qu’un utilisateur est connecté.
- **API**: interface qui permet au mobile de parler au backend.
- **Expo**: outil qui simplifie le développement React Native.
- **PostgreSQL**: base de données relationnelle.
- **IA**: intelligence artificielle qui analyse l’image.
- **Fallback**: solution de secours utilisée quand la solution principale échoue.

---

## 17. Génération du PDF

Pour générer un PDF à partir de ce document, la solution la plus simple reste d’utiliser un convertisseur Markdown vers PDF.

Si `pandoc` est installé:

```powershell
Set-Location "D:\Projet_Etude\projet-etude-2eme-annee"
pandoc -s docs/TECHNICAL_DOCUMENTATION.md -o docs/Parcell-IA-Technical-Documentation.pdf --metadata title="Parcell-IA — Documentation technique complète"
```

Si `pandoc` n’est pas disponible, il faudra utiliser un autre convertisseur Markdown vers PDF ou installer `pandoc` avant la génération.

---

## 18. Résumé final

Parcell-IA est une application complète mais volontairement simple à exploiter:

- le mobile sert d’interface principale,
- le backend centralise la logique,
- la base de données conserve les données métier,
- l’IA analyse les photos,
- Docker facilite le lancement local.

Si vous devez reprendre le projet, commencez par le README, puis relisez cette documentation et les fichiers listés dans la section des fichiers importants.