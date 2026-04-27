require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const diagnosticsRoutes = require('./routes/diagnostics');
const parcellesRoutes = require('./routes/parcelles');
const zonesRoutes = require('./routes/zones');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', project: 'parcell-ia' }));

app.use('/auth', authRoutes);
app.use('/diagnostics', diagnosticsRoutes);
app.use('/parcelles', parcellesRoutes);
app.use('/zones', zonesRoutes);

app.listen(PORT, () => {
  console.log(`Backend parcell-ia démarré sur le port ${PORT}`);
});
