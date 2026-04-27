import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

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
  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const isWeb = Platform.OS === 'web';

  function handleMapPress(event) {
    if (!drawMode) return;
    const { coordinate } = event.nativeEvent;
    setPoints((current) => [...current, coordinate]);
  }

  function removePoint(index) {
    setPoints((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function clearPoints() {
    setPoints([]);
  }

  function undoPoint() {
    setPoints((current) => current.slice(0, -1));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carte des parcelles</Text>
        <Pressable onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.action}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <MapView style={styles.map} initialRegion={region} onPress={handleMapPress}>
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

          {points.length >= 3 && (
            <Polygon
              coordinates={points}
              strokeColor="#1f6f4a"
              fillColor="rgba(33, 84, 61, 0.25)"
              strokeWidth={2}
              onPress={() => setPanelOpen(true)}
            />
          )}

          {points.map((point, index) => (
            <Marker
              key={`point-${index}`}
              coordinate={point}
              pinColor="#c96c2d"
              onPress={() => removePoint(index)}
              title={`Point ${index + 1}`}
              description="Appuie pour supprimer"
            />
          ))}
        </MapView>
      </View>

      <View style={styles.drawPanel}>
        <Pressable
          style={[styles.drawButton, drawMode ? styles.drawButtonActive : null]}
          onPress={() => setDrawMode((current) => !current)}
        >
          <Text style={[styles.drawButtonText, drawMode ? styles.drawButtonTextActive : null]}>
            {drawMode ? 'Mode dessin actif' : 'Mode dessin'}
          </Text>
        </Pressable>
        <View style={styles.drawActionsRow}>
          <Pressable style={styles.drawAction} onPress={undoPoint} disabled={!points.length}>
            <Text style={styles.drawActionText}>Annuler point</Text>
          </Pressable>
          <Pressable style={styles.drawAction} onPress={clearPoints} disabled={!points.length}>
            <Text style={styles.drawActionText}>Effacer</Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>Appuie sur la carte pour ajouter un point. Appuie sur un point pour le supprimer.</Text>
      </View>

      {!hasCoords && (
        <Text style={styles.helper}>Aucune coordonnee valide pour afficher la carte.</Text>
      )}

      {panelOpen && (
        <View style={[styles.sliderPanel, isWeb ? styles.sliderPanelRight : styles.sliderPanelBottom]}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderTitle}>Diagnostic (placeholder)</Text>
            <Pressable onPress={() => setPanelOpen(false)}>
              <Text style={styles.sliderClose}>Fermer</Text>
            </Pressable>
          </View>
          <View style={styles.sliderBody}>
            <Text style={styles.sliderText}>Contenu a definir</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    position: 'relative',
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
  drawPanel: {
    gap: 10,
  },
  drawButton: {
    borderWidth: 1,
    borderColor: '#d9cdb7',
    backgroundColor: '#fffdf8',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  drawButtonActive: {
    backgroundColor: '#21543d',
    borderColor: '#21543d',
  },
  drawButtonText: {
    color: '#4d5a4d',
    fontWeight: '700',
  },
  drawButtonTextActive: {
    color: '#fffdf8',
  },
  drawActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  drawAction: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e8e1d3',
  },
  drawActionText: {
    color: '#4d5a4d',
    fontWeight: '700',
  },
  sliderPanel: {
    position: 'absolute',
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#e0d8c7',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  sliderPanelRight: {
    top: 90,
    right: 16,
    width: 280,
    minHeight: 220,
  },
  sliderPanelBottom: {
    left: 16,
    right: 16,
    bottom: 16,
    minHeight: 200,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTitle: {
    color: '#1d2a1e',
    fontSize: 16,
    fontWeight: '800',
  },
  sliderClose: {
    color: '#21543d',
    fontWeight: '700',
  },
  sliderBody: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee7d8',
    padding: 12,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderText: {
    color: '#6c776d',
  },
});
