import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { createParcelle } from '../services/api';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const DEFAULT_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
  zoom: 11,
};

function parseGeometry(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizePolygon(geometry) {
  const points = parseGeometry(geometry);
  if (!points) return null;
  const cleaned = points
    .map((p) => ({
      lat: Number(p.lat ?? p.latitude),
      lng: Number(p.lng ?? p.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  return cleaned.length >= 3 ? cleaned : null;
}

function computeSurfaceHa(points) {
  if (!points || points.length < 3) return 0;
  const R = 6378137;
  const toRad = (deg) => (deg * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area +=
      toRad(b.lng - a.lng) *
      (2 + Math.sin(toRad(a.lat)) + Math.sin(toRad(b.lat)));
  }
  area = (area * R * R) / 2;
  return Math.abs(area) / 10000;
}

function buildLeafletHtml({ center, savedPolygons }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      body { background: #fffdf8; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map').setView([${center.latitude}, ${center.longitude}], ${center.zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      var savedLayer = L.layerGroup().addTo(map);
      var savedPolygons = ${JSON.stringify(savedPolygons || [])};
      savedPolygons.forEach(function (poly) {
        var coords = poly.points.map(function (p) { return [p.lat, p.lng]; });
        var layer = L.polygon(coords, {
          color: '#21543d',
          fillColor: '#21543d',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(savedLayer);
        layer.bindPopup('<b>' + poly.name + '</b><br/>' + (poly.culture || '') + '<br/>' + (poly.surface_ha || '-') + ' ha');
      });

      var drawMode = false;
      var points = [];
      var polygon = null;
      var pointMarkers = [];
      var userMarker = null;

      function send(message) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else if (window.parent) {
          window.parent.postMessage(JSON.stringify(message), '*');
        }
      }

      function refreshPolygon() {
        if (polygon) { map.removeLayer(polygon); polygon = null; }
        if (points.length >= 3) {
          polygon = L.polygon(points, {
            color: '#c96c2d',
            fillColor: '#c96c2d',
            fillOpacity: 0.25,
            weight: 2
          }).addTo(map);
        }
      }

      function refreshPointMarkers() {
        pointMarkers.forEach(function (m) { map.removeLayer(m); });
        pointMarkers = points.map(function (pt, idx) {
          var marker = L.circleMarker(pt, {
            radius: 7,
            color: '#c96c2d',
            fillColor: '#c96c2d',
            fillOpacity: 0.9,
            weight: 2
          }).addTo(map);
          marker.on('click', function () { send({ type: 'removePoint', index: idx }); });
          return marker;
        });
      }

      function setUserLocation(lat, lng) {
        if (userMarker) { map.removeLayer(userMarker); }
        userMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#1d6fe5',
          fillColor: '#1d6fe5',
          fillOpacity: 0.85,
          weight: 3
        }).addTo(map);
        userMarker.bindPopup('Vous etes ici');
      }

      map.on('click', function (e) {
        if (!drawMode) return;
        points.push([e.latlng.lat, e.latlng.lng]);
        refreshPolygon();
        refreshPointMarkers();
        send({
          type: 'pointsChanged',
          points: points.map(function (p) { return { lat: p[0], lng: p[1] }; })
        });
      });

      document.addEventListener('message', handleHostMessage);
      window.addEventListener('message', handleHostMessage);

      function handleHostMessage(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === 'setDrawMode') { drawMode = !!data.value; }
          if (data.type === 'undo') {
            points.pop();
            refreshPolygon();
            refreshPointMarkers();
            send({
              type: 'pointsChanged',
              points: points.map(function (p) { return { lat: p[0], lng: p[1] }; })
            });
          }
          if (data.type === 'clear') {
            points = [];
            refreshPolygon();
            refreshPointMarkers();
            send({
              type: 'pointsChanged',
              points: []
            });
          }
          if (data.type === 'removePoint' && typeof data.index === 'number') {
            points.splice(data.index, 1);
            refreshPolygon();
            refreshPointMarkers();
            send({
              type: 'pointsChanged',
              points: points.map(function (p) { return { lat: p[0], lng: p[1] }; })
            });
          }
          if (data.type === 'centerOn' && typeof data.lat === 'number' && typeof data.lng === 'number') {
            map.setView([data.lat, data.lng], data.zoom || 14);
            setUserLocation(data.lat, data.lng);
          }
        } catch (err) {}
      }

      send({ type: 'ready' });
    </script>
  </body>
</html>`;
}

function CultureBadge({ culture }) {
  return (
    <View style={styles.cultureBadge}>
      <Text style={styles.cultureBadgeText}>{culture || 'Culture inconnue'}</Text>
    </View>
  );
}

export default function MapScreen({ parcelles, refreshing, onRefresh, token }) {
  const savedPolygons = useMemo(() => {
    return parcelles
      .map((parcelle) => {
        const points = normalizePolygon(parcelle.geometry);
        if (!points) return null;
        return {
          id: parcelle.id,
          name: String(parcelle.name || '').replace(/[<>]/g, ''),
          culture: String(parcelle.culture || '').replace(/[<>]/g, ''),
          surface_ha: parcelle.surface_ha,
          points,
        };
      })
      .filter(Boolean);
  }, [parcelles]);

  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCulture, setFormCulture] = useState('');
  const isWeb = Platform.OS === 'web';

  const initialHtml = useMemo(
    () => buildLeafletHtml({ center: DEFAULT_CENTER, savedPolygons }),
    [savedPolygons]
  );

  const webviewRef = useRef(null);
  const iframeRef = useRef(null);
  const mapReadyRef = useRef(false);
  const pendingCenterRef = useRef(null);

  function postToMap(message) {
    const payload = JSON.stringify(message);
    if (isWeb) {
      const win = iframeRef.current?.contentWindow;
      if (win) win.postMessage(payload, '*');
    } else if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `(function(){try{var ev=new MessageEvent('message',{data:${JSON.stringify(payload)}});window.dispatchEvent(ev);document.dispatchEvent(ev);}catch(e){}})();true;`
      );
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function locate() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const message = {
          type: 'centerOn',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          zoom: 15,
        };
        if (mapReadyRef.current) {
          postToMap(message);
        } else {
          pendingCenterRef.current = message;
        }
      } catch {}
    }
    locate();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleDrawMode() {
    setDrawMode((current) => {
      const next = !current;
      postToMap({ type: 'setDrawMode', value: next });
      return next;
    });
  }

  function clearPoints() {
    postToMap({ type: 'clear' });
  }

  function undoPoint() {
    postToMap({ type: 'undo' });
  }

  function handleMapMessage(rawData) {
    try {
      const data = JSON.parse(rawData);
      if (data.type === 'ready') {
        mapReadyRef.current = true;
        if (pendingCenterRef.current) {
          postToMap(pendingCenterRef.current);
          pendingCenterRef.current = null;
        }
      }
      if (data.type === 'pointsChanged') {
        setPoints(Array.isArray(data.points) ? data.points : []);
      }
    } catch {}
  }

  function openSaveForm() {
    if (points.length < 3) {
      Alert.alert('Polygone incomplet', 'Place au moins 3 points sur la carte.');
      return;
    }
    setFormName('');
    setFormCulture('');
    setFormOpen(true);
  }

  async function handleSave() {
    const name = formName.trim();
    if (!name) {
      Alert.alert('Nom requis', 'Donne un nom a la parcelle.');
      return;
    }
    if (points.length < 3) {
      Alert.alert('Polygone incomplet', 'Place au moins 3 points sur la carte.');
      return;
    }
    setSaving(true);
    try {
      const surface_ha = Number(computeSurfaceHa(points).toFixed(2));
      await createParcelle(token, {
        name,
        culture: formCulture.trim() || null,
        surface_ha,
        geometry: points,
      });
      setFormOpen(false);
      setDrawMode(false);
      postToMap({ type: 'setDrawMode', value: false });
      postToMap({ type: 'clear' });
      if (onRefresh) await onRefresh();
    } catch (error) {
      Alert.alert('Sauvegarde impossible', error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parcelles</Text>
        <Pressable onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.action}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        {isWeb ? (
          <iframe
            ref={iframeRef}
            title="map"
            srcDoc={initialHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => {
              const win = iframeRef.current?.contentWindow;
              if (win) {
                window.addEventListener('message', (event) => {
                  if (event.source === win && typeof event.data === 'string') {
                    handleMapMessage(event.data);
                  }
                });
              }
            }}
          />
        ) : (
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: initialHtml }}
            style={styles.map}
            onMessage={(event) => handleMapMessage(event.nativeEvent.data)}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>

      <View style={styles.drawPanel}>
        <Pressable
          style={[styles.drawButton, drawMode ? styles.drawButtonActive : null]}
          onPress={toggleDrawMode}
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
        <Pressable
          style={[styles.saveButton, points.length < 3 ? styles.saveButtonDisabled : null]}
          onPress={openSaveForm}
          disabled={points.length < 3}
        >
          <Text style={styles.saveButtonText}>
            Enregistrer la parcelle ({points.length} point{points.length > 1 ? 's' : ''})
          </Text>
        </Pressable>
        <Text style={styles.helper}>Appuie sur la carte pour ajouter un point. Appuie sur un point pour le supprimer.</Text>
      </View>

      {formOpen && (
        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>Nouvelle parcelle</Text>
          <Text style={styles.formLabel}>Nom</Text>
          <TextInput
            style={styles.formInput}
            value={formName}
            onChangeText={setFormName}
            placeholder="Ex: Parcelle Nord"
            placeholderTextColor="#9aa49a"
          />
          <Text style={styles.formLabel}>Culture (optionnel)</Text>
          <TextInput
            style={styles.formInput}
            value={formCulture}
            onChangeText={setFormCulture}
            placeholder="Ex: Ble tendre"
            placeholderTextColor="#9aa49a"
          />
          <Text style={styles.formHelper}>
            Surface estimee: {computeSurfaceHa(points).toFixed(2)} ha
          </Text>
          <View style={styles.formActions}>
            <Pressable
              style={[styles.formAction, styles.formActionGhost]}
              onPress={() => setFormOpen(false)}
              disabled={saving}
            >
              <Text style={styles.formActionGhostText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.formAction, styles.formActionPrimary, saving ? styles.formActionDisabled : null]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.formActionPrimaryText}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {parcelles.length === 0 && (
        <Text style={styles.empty}>Aucune parcelle enregistree.</Text>
      )}

      {parcelles.map((parcelle) => {
        const lat = Number(parcelle.latitude);
        const lng = Number(parcelle.longitude);
        const hasParcelCoords = Number.isFinite(lat) && Number.isFinite(lng);

        return (
          <View key={parcelle.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{parcelle.name}</Text>
              <CultureBadge culture={parcelle.culture} />
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Surface</Text>
              <Text style={styles.cardValue}>{parcelle.surface_ha || '-'} ha</Text>
            </View>
            {hasParcelCoords && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Centre</Text>
                <Text style={styles.cardValue}>{lat.toFixed(4)}, {lng.toFixed(4)}</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
    position: 'relative',
  },
  headerRow: {
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
    backgroundColor: '#fffdf8',
  },
  helper: {
    color: '#6c776d',
    fontSize: 13,
  },
  empty: {
    color: '#6c776d',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0d8c7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#1d2a1e',
    fontSize: 16,
    fontWeight: '800',
  },
  cultureBadge: {
    backgroundColor: '#d6ecda',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cultureBadgeText: {
    color: '#1d5c2e',
    fontSize: 12,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee7d8',
    paddingTop: 8,
  },
  cardLabel: {
    color: '#677267',
    fontWeight: '600',
  },
  cardValue: {
    color: '#1d2a1e',
    fontWeight: '700',
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
  saveButton: {
    backgroundColor: '#c96c2d',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#d8c4b3',
  },
  saveButtonText: {
    color: '#fffaf5',
    fontWeight: '800',
  },
  formPanel: {
    backgroundColor: '#fffdf8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0d8c7',
    padding: 16,
    gap: 8,
  },
  formTitle: {
    color: '#1d2a1e',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  formLabel: {
    color: '#677267',
    fontWeight: '600',
    fontSize: 13,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0d8c7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1d2a1e',
    backgroundColor: '#fbf6ea',
  },
  formHelper: {
    color: '#6c776d',
    fontSize: 13,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  formAction: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  formActionGhost: {
    backgroundColor: '#e8e1d3',
  },
  formActionGhostText: {
    color: '#4d5a4d',
    fontWeight: '700',
  },
  formActionPrimary: {
    backgroundColor: '#21543d',
  },
  formActionPrimaryText: {
    color: '#fffaf5',
    fontWeight: '800',
  },
  formActionDisabled: {
    opacity: 0.6,
  },
});
