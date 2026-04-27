require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const diagnosticsRoutes = require('./routes/diagnostics');
const parcellesRoutes = require('./routes/parcelles');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.send('Bienvenue sur l\'API de Parcell-IA !'));

app.get('/health', (req, res) => res.json({ status: 'ok', project: 'parcell-ia' }));

app.use('/auth', authRoutes);
app.use('/diagnostics', diagnosticsRoutes);
app.use('/parcelles', parcellesRoutes);

app.listen(PORT, () => {
  console.log(`Backend parcell-ia démarré sur le port ${PORT}`);
});
