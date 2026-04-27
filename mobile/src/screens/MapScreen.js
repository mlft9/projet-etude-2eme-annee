import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

function getRegion(parcelles) {
  const coords = parcelles
    .map((parcelle) => ({
      latitude: Number(parcelle.latitude),
      longitude: Number(parcelle.longitude),
    }))
    .filter((coord) => Number.isFinite(coord.latitude) && Number.isFinite(coord.longitude));

  if (!coords.length) return DEFAULT_REGION;

  const sum = coords.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / coords.length,
    longitude: sum.longitude / coords.length,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };
}

export default function MapScreen({ parcelles, refreshing, onRefresh }) {
  const region = getRegion(parcelles);
  const hasCoords = parcelles.some((parcelle) =>
    Number.isFinite(Number(parcelle.latitude)) && Number.isFinite(Number(parcelle.longitude))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carte des parcelles</Text>
        <Pressable onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.action}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <MapView style={styles.map} initialRegion={region}>
          {parcelles.map((parcelle) => {
            const latitude = Number(parcelle.latitude);
            const longitude = Number(parcelle.longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

            return (
              <Marker
                key={parcelle.id}
                coordinate={{ latitude, longitude }}
                title={parcelle.name}
                description={`${parcelle.culture || 'Culture'} | ${parcelle.surface_ha || '-'} ha`}
              />
            );
          })}
        </MapView>
      </View>

      {!hasCoords && (
        <Text style={styles.helper}>Aucune coordonnee valide pour afficher la carte.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#1d2a1e',
    fontSize: 18,
    fontWeight: '800',
  },
  action: {
    color: '#21543d',
    fontWeight: '700',
  },
  mapCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0d8c7',
    backgroundColor: '#fffdf8',
    height: 360,
  },
  map: {
    flex: 1,
  },
  helper: {
    color: '#6c776d',
    fontSize: 13,
  },
});
