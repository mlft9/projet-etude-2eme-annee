/**
 * Conteneur d'injection de dépendances.
 * Chaque couche reçoit ses dépendances par constructeur — aucun module
 * n'importe directement la base de données ou les services voisins.
 */
const { User, Parcelle, Diagnostic, CapteurReleve, Capteur } = require('./models');

const AiProvider = require('./providers/ai.provider');

const AuthRepository = require('./modules/auth/auth.repository');
const AuthService = require('./modules/auth/auth.service');
const AuthController = require('./modules/auth/auth.controller');

const ParcellesRepository = require('./modules/parcelles/parcelles.repository');
const ParcellesService = require('./modules/parcelles/parcelles.service');
const ParcellesController = require('./modules/parcelles/parcelles.controller');

const DiagnosticsRepository = require('./modules/diagnostics/diagnostics.repository');
const DiagnosticsService = require('./modules/diagnostics/diagnostics.service');
const DiagnosticsController = require('./modules/diagnostics/diagnostics.controller');

const CapteursRepository = require('./modules/capteurs/capteurs.repository');
const CapteursService = require('./modules/capteurs/capteurs.service');
const CapteursController = require('./modules/capteurs/capteurs.controller');

// --- instanciation ---
const aiProvider = new AiProvider();

const authRepository = new AuthRepository(User);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const parcellesRepository = new ParcellesRepository(Parcelle, CapteurReleve, Capteur);
const parcellesService = new ParcellesService(parcellesRepository);
const parcellesController = new ParcellesController(parcellesService);

const diagnosticsRepository = new DiagnosticsRepository(Diagnostic);
const diagnosticsService = new DiagnosticsService(diagnosticsRepository, aiProvider);
const diagnosticsController = new DiagnosticsController(diagnosticsService);

const capteursRepository = new CapteursRepository(Capteur, CapteurReleve);
const capteursService = new CapteursService(capteursRepository);
const capteursController = new CapteursController(capteursService);

module.exports = { authController, parcellesController, diagnosticsController, capteursController };
