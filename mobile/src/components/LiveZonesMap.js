import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';

import { createDrawnZone, fetchZonesSnapshot } from '../services/api';

function riskToColors(risk) {
  if (risk === 'Élevé') {
    return { stroke: '#a13228', fill: 'rgba(161, 50, 40, 0.30)' };
  }

  if (risk === 'Modéré') {
    return { stroke: '#cf7b20', fill: 'rgba(207, 123, 32, 0.28)' };
  }

  return { stroke: '#256d4f', fill: 'rgba(37, 109, 79, 0.26)' };
}

function toMapCoordinates(feature) {
  const ring = feature?.geometry?.coordinates?.[0] || [];
  return ring
    .map((point) => {
      const [longitude, latitude] = point;
      const lon = Number(longitude);
      const lat = Number(latitude);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return { latitude: lat, longitude: lon };
    })
    .filter(Boolean);
}

function toRiskLabel(value) {
  if (value === 'Élevé' || value === 'Modéré' || value === 'Faible' || value === 'Aucun') {
    return value;
  }

  if (value === 'Eleve') return 'Élevé';
  if (value === 'Modere') return 'Modéré';
  return 'Aucun';
}

export default function LiveZonesMap() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zones, setZones] = useState([]);
  const [drawMode, setDrawMode] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [saving, setSaving] = useState(false);

  const mapItems = useMemo(() => {
    return zones
      .map((feature) => {
        const coordinates = toMapCoordinates(feature);

        if (coordinates.length < 3) {
          return null;
        }

        return {
          id: String(feature.properties?.id || Math.random()),
          coordinates,
          properties: {
            ...feature.properties,
            niveau_risque: toRiskLabel(feature.properties?.niveau_risque),
          },
        };
      })
      .filter(Boolean);
  }, [zones]);

  const loadZones = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setRefreshing(true);
    }

    try {
      const payload = await fetchZonesSnapshot();
      setZones(payload?.features || []);
    } catch (error) {
      Alert.alert('Carte indisponible', error.message);
    } finally {
      if (showSpinner) {
        setRefreshing(false);
      }

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();

    const timer = setInterval(() => {
      loadZones();
    }, 3000);

    return () => clearInterval(timer);
  }, [loadZones]);

  function onMapPress(event) {
    if (!drawMode) return;

    const coordinate = event.nativeEvent.coordinate;
    setDraftPoints((current) => [...current, coordinate]);
  }

  function toggleDrawMode() {
    setDrawMode((current) => {
      const next = !current;

      if (!next) {
        setDraftPoints([]);
      }

      return next;
    });
  }

  async function saveDraftZone() {
    if (draftPoints.length < 3) {
      Alert.alert('Zone invalide', 'Ajoute au moins 3 points sur la carte pour créer une zone.');
      return;
    }

    const ring = draftPoints.map((point) => [point.longitude, point.latitude]);
    ring.push([draftPoints[0].longitude, draftPoints[0].latitude]);

    const label = `Zone mobile ${new Date().toLocaleTimeString('fr-FR')}`;

    setSaving(true);
    try {
      await createDrawnZone({
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
        properties: {
          id: Date.now(),
          name: label,
          niveau_risque: 'Faible',
        },
      });

      setDraftPoints([]);
      setDrawMode(false);
      await loadZones(true);
      Alert.alert('Zone enregistrée', 'La zone dessinée est visible en temps réel.');
    } catch (error) {
      Alert.alert('Enregistrement impossible', error.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedDetails = selectedZone?.properties;

  return (
    <View style={styles.wrapper}>
      <View style={styles.controlsRow}>
        <Pressable style={styles.controlButton} onPress={() => loadZones(true)} disabled={refreshing}>
          <Text style={styles.controlButtonText}>{refreshing ? 'Sync...' : 'Actualiser'}</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, drawMode ? styles.controlButtonActive : null]}
          onPress={toggleDrawMode}
          disabled={saving}
        >
          <Text style={styles.controlButtonText}>{drawMode ? 'Annuler dessin' : 'Dessiner zone'}</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, styles.controlButtonPrimary]}
          onPress={saveDraftZone}
          disabled={!drawMode || saving}
        >
          <Text style={[styles.controlButtonText, styles.controlButtonPrimaryText]}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.mapHint}>
        {drawMode
          ? `Mode dessin actif: ${draftPoints.length} point(s). Touchez la carte pour tracer votre zone.`
          : 'Flux temps réel actif: la carte se synchronise toutes les 3 secondes.'}
      </Text>

      <View style={styles.mapCard}>
        {loading ? (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color="#21543d" />
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 48.8566,
              longitude: 2.3522,
              latitudeDelta: 0.22,
              longitudeDelta: 0.22,
            }}
            onPress={onMapPress}
          >
            {mapItems.map((item) => {
              const colors = riskToColors(item.properties?.niveau_risque);
              return (
                <Polygon
                  key={item.id}
                  coordinates={item.coordinates}
                  strokeColor={colors.stroke}
                  fillColor={colors.fill}
                  strokeWidth={2}
                  tappable
                  onPress={() => setSelectedZone(item)}
                />
              );
            })}

            {draftPoints.length > 0
              ? draftPoints.map((point, index) => (
                  <Marker
                    key={`draft-${index}`}
                    coordinate={point}
                    pinColor="#c96c2d"
                    title={`Point ${index + 1}`}
                  />
                ))
              : null}

            {draftPoints.length > 1 ? <Polyline coordinates={draftPoints} strokeColor="#c96c2d" strokeWidth={3} /> : null}
          </MapView>
        )}
      </View>

      <View style={styles.detailsCard}>
        {selectedDetails ? (
          <>
            <Text style={styles.detailsTitle}>{selectedDetails.name || 'Zone'}</Text>
            <Text style={styles.detailsLine}>Culture: {selectedDetails.culture || 'N/A'}</Text>
            <Text style={styles.detailsLine}>Risque: {selectedDetails.niveau_risque || 'Aucun'}</Text>
            <Text style={styles.detailsLine}>Maladie: {selectedDetails.maladie_detectee || 'N/A'}</Text>
            <Text style={styles.detailsLine}>Température: {selectedDetails.temperature ?? 'N/A'} C</Text>
            <Text style={styles.detailsLine}>Humidité: {selectedDetails.humidite ?? 'N/A'} %</Text>
            <Text style={styles.detailsLine}>Pluviométrie: {selectedDetails.pluviometrie ?? 'N/A'} mm</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Touchez une zone pour afficher ses données live.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#ece3d5',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#7b2d22',
  },
  controlButtonPrimary: {
    backgroundColor: '#21543d',
  },
  controlButtonText: {
    color: '#4f5d50',
    fontWeight: '700',
    fontSize: 12,
  },
  controlButtonPrimaryText: {
    color: '#fffdf8',
  },
  mapHint: {
    color: '#5f6f61',
    fontSize: 13,
  },
  mapCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dfd6c6',
    backgroundColor: '#e8e2d4',
  },
  mapLoader: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: 320,
  },
  detailsCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0d8c7',
  },
  detailsTitle: {
    color: '#1d2a1e',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailsLine: {
    color: '#405041',
    fontSize: 13,
  },
  emptyText: {
    color: '#6c776d',
    fontSize: 13,
  },
});
