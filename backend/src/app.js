require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');

const authMiddleware = require('./middleware/auth');
const { authController, parcellesController, diagnosticsController, capteursController } = require('./container');

const createAuthRoutes = require('./modules/auth/auth.routes');
const createParcellesRoutes = require('./modules/parcelles/parcelles.routes');
const createDiagnosticsRoutes = require('./modules/diagnostics/diagnostics.routes');
const createCapteursRoutes = require('./modules/capteurs/capteurs.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.send('Bienvenue sur l\'API de Parcell-IA !'));
app.get('/health', (req, res) => res.json({ status: 'ok', project: 'parcell-ia' }));

app.use('/auth', createAuthRoutes(authController));
app.use('/parcelles', createParcellesRoutes(parcellesController, authMiddleware));
app.use('/diagnostics', createDiagnosticsRoutes(diagnosticsController, authMiddleware));
app.use('/capteurs', createCapteursRoutes(capteursController, authMiddleware));

module.exports = app;
