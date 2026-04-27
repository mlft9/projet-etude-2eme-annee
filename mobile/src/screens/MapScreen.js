import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const DEFAULT_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
  zoom: 11,
};

function getCenter(parcelles) {
  const coords = parcelles
    .map((parcelle) => ({
      latitude: Number(parcelle.latitude),
      longitude: Number(parcelle.longitude),
    }))
    .filter((coord) => Number.isFinite(coord.latitude) && Number.isFinite(coord.longitude));

  if (!coords.length) return DEFAULT_CENTER;

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
    zoom: 12,
  };
}

function buildLeafletHtml({ center, markers }) {
  const safeMarkers = markers
    .map((marker) => ({
      lat: Number(marker.latitude),
      lng: Number(marker.longitude),
      title: String(marker.name || '').replace(/"/g, '\\"'),
      description: String(
        `${marker.culture || 'Culture'} | ${marker.surface_ha || '-'} ha`
      ).replace(/"/g, '\\"'),
    }))
    .filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng));

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

      var parcelles = ${JSON.stringify(safeMarkers)};
      parcelles.forEach(function (p) {
        L.marker([p.lat, p.lng]).addTo(map).bindPopup('<b>' + p.title + '</b><br/>' + p.description);
      });

      var drawMode = false;
      var points = [];
      var polygon = null;
      var pointMarkers = [];

      function send(message) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      }

      function refreshPolygon() {
        if (polygon) { map.removeLayer(polygon); polygon = null; }
        if (points.length >= 3) {
          polygon = L.polygon(points, {
            color: '#1f6f4a',
            fillColor: '#21543d',
            fillOpacity: 0.25,
            weight: 2
          }).addTo(map);
          polygon.on('click', function () { send({ type: 'polygonPress' }); });
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

      map.on('click', function (e) {
        if (!drawMode) return;
        points.push([e.latlng.lat, e.latlng.lng]);
        refreshPolygon();
        refreshPointMarkers();
        send({ type: 'pointsChanged', count: points.length });
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
            send({ type: 'pointsChanged', count: points.length });
          }
          if (data.type === 'clear') {
            points = [];
            refreshPolygon();
            refreshPointMarkers();
            send({ type: 'pointsChanged', count: points.length });
          }
          if (data.type === 'removePoint' && typeof data.index === 'number') {
            points.splice(data.index, 1);
            refreshPolygon();
            refreshPointMarkers();
            send({ type: 'pointsChanged', count: points.length });
          }
        } catch (err) {}
      }
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

export default function MapScreen({ parcelles, refreshing, onRefresh }) {
  const center = useMemo(() => getCenter(parcelles), [parcelles]);
  const hasCoords = parcelles.some((parcelle) =>
    Number.isFinite(Number(parcelle.latitude)) && Number.isFinite(Number(parcelle.longitude))
  );
  const [drawMode, setDrawMode] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const isWeb = Platform.OS === 'web';

  const html = useMemo(
    () => buildLeafletHtml({ center, markers: parcelles }),
    [center, parcelles]
  );

  const webviewRef = useRef(null);
  const iframeRef = useRef(null);

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
      if (data.type === 'pointsChanged') setPointCount(data.count || 0);
      if (data.type === 'polygonPress') setPanelOpen(true);
    } catch {}
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
            srcDoc={html}
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
            source={{ html }}
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
          <Pressable style={styles.drawAction} onPress={undoPoint} disabled={!pointCount}>
            <Text style={styles.drawActionText}>Annuler point</Text>
          </Pressable>
          <Pressable style={styles.drawAction} onPress={clearPoints} disabled={!pointCount}>
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
              <Text style={styles.cardValue}>{parcelle.surface_ha} ha</Text>
            </View>
            {hasParcelCoords && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Coordonnees</Text>
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
