const bcrypt = require('bcrypt');
const { User, Parcelle } = require('./models');

async function seed() {
  const [user] = await User.findOrCreate({
    where: { email: 'demo@parcell-ia.com' },
    defaults: {
      password_hash: await bcrypt.hash('demo123', 10),
      name: 'Agriculteur Demo',
    },
  });

  await Parcelle.findOrCreate({
    where: { user_id: user.id, name: 'Parcelle Nord' },
    defaults: {
      user_id: user.id,
      name: 'Parcelle Nord',
      culture: 'Blé tendre',
      surface_ha: 4.2,
      latitude: 48.1234,
      longitude: -1.6789,
      geometry: [
        { lat: 48.1250, lng: -1.6810 },
        { lat: 48.1250, lng: -1.6770 },
        { lat: 48.1218, lng: -1.6770 },
        { lat: 48.1218, lng: -1.6810 },
      ],
    },
  });

  await Parcelle.findOrCreate({
    where: { user_id: user.id, name: 'Parcelle Sud' },
    defaults: {
      user_id: user.id,
      name: 'Parcelle Sud',
      culture: 'Maïs',
      surface_ha: 2.8,
      latitude: 48.1190,
      longitude: -1.6740,
      geometry: [
        { lat: 48.1205, lng: -1.6755 },
        { lat: 48.1205, lng: -1.6725 },
        { lat: 48.1175, lng: -1.6725 },
        { lat: 48.1175, lng: -1.6755 },
      ],
    },
  });

  console.log('Seed OK — user demo + parcelles initialisés');
}

module.exports = seed;
