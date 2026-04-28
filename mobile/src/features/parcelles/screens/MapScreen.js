import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { createParcelle } from '../../../shared/services/api';
import { normalizePolygon, computeSurfaceHa } from '../../../shared/utils/geo';
import CultureBadge from '../components/CultureBadge';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const DEFAULT_CENTER = { latitude: 48.8566, longitude: 2.3522, zoom: 11 };

function buildLeafletHtml({ center, savedPolygons }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html, body, #map { height: 100%; margin: 0; padding: 0; } body { background: #fffdf8; }</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map').setView([${center.latitude}, ${center.longitude}], ${center.zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

      var savedLayer = L.layerGroup().addTo(map);
      var savedPolygons = ${JSON.stringify(savedPolygons || [])};
      savedPolygons.forEach(function (poly) {
        var coords = poly.points.map(function (p) { return [p.lat, p.lng]; });
        L.polygon(coords, { color: '#21543d', fillColor: '#21543d', fillOpacity: 0.2, weight: 2 })
          .addTo(savedLayer)
          .bindPopup('<b>' + poly.name + '</b><br/>' + (poly.culture || '') + '<br/>' + (poly.surface_ha || '-') + ' ha');
      });

      var drawMode = false, points = [], polygon = null, pointMarkers = [], userMarker = null;

      function send(message) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
        else if (window.parent) window.parent.postMessage(JSON.stringify(message), '*');
      }

      function refreshPolygon() {
        if (polygon) { map.removeLayer(polygon); polygon = null; }
        if (points.length >= 3) polygon = L.polygon(points, { color: '#c96c2d', fillColor: '#c96c2d', fillOpacity: 0.25, weight: 2 }).addTo(map);
      }

      function refreshPointMarkers() {
        pointMarkers.forEach(function (m) { map.removeLayer(m); });
        pointMarkers = points.map(function (pt, idx) {
          var m = L.circleMarker(pt, { radius: 7, color: '#c96c2d', fillColor: '#c96c2d', fillOpacity: 0.9, weight: 2 }).addTo(map);
          m.on('click', function () { send({ type: 'removePoint', index: idx }); });
          return m;
        });
      }

      map.on('click', function (e) {
        if (!drawMode) return;
        points.push([e.latlng.lat, e.latlng.lng]);
        refreshPolygon(); refreshPointMarkers();
        send({ type: 'pointsChanged', points: points.map(function (p) { return { lat: p[0], lng: p[1] }; }) });
      });

      function handleHostMessage(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === 'setDrawMode') drawMode = !!data.value;
          if (data.type === 'undo') { points.pop(); refreshPolygon(); refreshPointMarkers(); send({ type: 'pointsChanged', points: points.map(function (p) { return { lat: p[0], lng: p[1] }; }) }); }
          if (data.type === 'clear') { points = []; refreshPolygon(); refreshPointMarkers(); send({ type: 'pointsChanged', points: [] }); }
          if (data.type === 'removePoint' && typeof data.index === 'number') { points.splice(data.index, 1); refreshPolygon(); refreshPointMarkers(); send({ type: 'pointsChanged', points: points.map(function (p) { return { lat: p[0], lng: p[1] }; }) }); }
          if (data.type === 'centerOn') { map.setView([data.lat, data.lng], data.zoom || 14); if (userMarker) map.removeLayer(userMarker); userMarker = L.circleMarker([data.lat, data.lng], { radius: 8, color: '#1d6fe5', fillColor: '#1d6fe5', fillOpacity: 0.85, weight: 3 }).addTo(map).bindPopup('Vous etes ici'); }
        } catch (err) {}
      }

      document.addEventListener('message', handleHostMessage);
      window.addEventListener('message', handleHostMessage);
      send({ type: 'ready' });
    </script>
  </body>
</html>`;
}

export default function MapScreen({ parcelles, refreshing, onRefresh, token }) {
  const savedPolygons = useMemo(() =>
    parcelles.map((p) => {
      const points = normalizePolygon(p.geometry);
      if (!points) return null;
      return { id: p.id, name: String(p.name || '').replace(/[<>]/g, ''), culture: String(p.culture || '').replace(/[<>]/g, ''), surface_ha: p.surface_ha, points };
    }).filter(Boolean),
  [parcelles]);

  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCulture, setFormCulture] = useState('');
  const isWeb = Platform.OS === 'web';
  const initialHtml = useMemo(() => buildLeafletHtml({ center: DEFAULT_CENTER, savedPolygons }), [savedPolygons]);
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
      webviewRef.current.injectJavaScript(`(function(){try{var ev=new MessageEvent('message',{data:${JSON.stringify(payload)}});window.dispatchEvent(ev);document.dispatchEvent(ev);}catch(e){}})();true;`);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function locate() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        const msg = { type: 'centerOn', lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 15 };
        if (mapReadyRef.current) postToMap(msg);
        else pendingCenterRef.current = msg;
      } catch {}
    }
    locate();
    return () => { cancelled = true; };
  }, []);

  function handleMapMessage(rawData) {
    try {
      const data = JSON.parse(rawData);
      if (data.type === 'ready') {
        mapReadyRef.current = true;
        if (pendingCenterRef.current) { postToMap(pendingCenterRef.current); pendingCenterRef.current = null; }
      }
      if (data.type === 'pointsChanged') setPoints(Array.isArray(data.points) ? data.points : []);
    } catch {}
  }

  function toggleDrawMode() {
    setDrawMode((curr) => { const next = !curr; postToMap({ type: 'setDrawMode', value: next }); return next; });
  }

  async function handleSave() {
    const name = formName.trim();
    if (!name) { Alert.alert('Nom requis', 'Donne un nom a la parcelle.'); return; }
    if (points.length < 3) { Alert.alert('Polygone incomplet', 'Place au moins 3 points.'); return; }
    setSaving(true);
    try {
      await createParcelle(token, { name, culture: formCulture.trim() || null, surface_ha: Number(computeSurfaceHa(points).toFixed(2)), geometry: points });
      setFormOpen(false); setDrawMode(false);
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
          <iframe ref={iframeRef} title="map" srcDoc={initialHtml} style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => { const win = iframeRef.current?.contentWindow; if (win) window.addEventListener('message', (e) => { if (e.source === win && typeof e.data === 'string') handleMapMessage(e.data); }); }} />
        ) : (
          <WebView ref={webviewRef} originWhitelist={['*']} source={{ html: initialHtml }} style={styles.map}
            onMessage={(e) => handleMapMessage(e.nativeEvent.data)} javaScriptEnabled domStorageEnabled />
        )}
      </View>

      <View style={styles.drawPanel}>
        <Pressable style={[styles.drawButton, drawMode ? styles.drawButtonActive : null]} onPress={toggleDrawMode}>
          <Text style={[styles.drawButtonText, drawMode ? styles.drawButtonTextActive : null]}>{drawMode ? 'Mode dessin actif' : 'Mode dessin'}</Text>
        </Pressable>
        <View style={styles.drawActionsRow}>
          <Pressable style={styles.drawAction} onPress={() => postToMap({ type: 'undo' })} disabled={!points.length}><Text style={styles.drawActionText}>Annuler point</Text></Pressable>
          <Pressable style={styles.drawAction} onPress={() => postToMap({ type: 'clear' })} disabled={!points.length}><Text style={styles.drawActionText}>Effacer</Text></Pressable>
        </View>
        <Pressable style={[styles.saveButton, points.length < 3 ? styles.saveButtonDisabled : null]}
          onPress={() => { if (points.length < 3) { Alert.alert('Polygone incomplet', 'Place au moins 3 points.'); return; } setFormName(''); setFormCulture(''); setFormOpen(true); }}
          disabled={points.length < 3}>
          <Text style={styles.saveButtonText}>Enregistrer la parcelle ({points.length} point{points.length > 1 ? 's' : ''})</Text>
        </Pressable>
        <Text style={styles.helper}>Appuie sur la carte pour ajouter un point. Appuie sur un point pour le supprimer.</Text>
      </View>

      {formOpen && (
        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>Nouvelle parcelle</Text>
          <Text style={styles.formLabel}>Nom</Text>
          <TextInput style={styles.formInput} value={formName} onChangeText={setFormName} placeholder="Ex: Parcelle Nord" placeholderTextColor="#9aa49a" />
          <Text style={styles.formLabel}>Culture (optionnel)</Text>
          <TextInput style={styles.formInput} value={formCulture} onChangeText={setFormCulture} placeholder="Ex: Ble tendre" placeholderTextColor="#9aa49a" />
          <Text style={styles.formHelper}>Surface estimee: {computeSurfaceHa(points).toFixed(2)} ha</Text>
          <View style={styles.formActions}>
            <Pressable style={[styles.formAction, styles.formActionGhost]} onPress={() => setFormOpen(false)} disabled={saving}><Text style={styles.formActionGhostText}>Annuler</Text></Pressable>
            <Pressable style={[styles.formAction, styles.formActionPrimary, saving ? styles.formActionDisabled : null]} onPress={handleSave} disabled={saving}><Text style={styles.formActionPrimaryText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text></Pressable>
          </View>
        </View>
      )}

      {parcelles.length === 0 && <Text style={styles.empty}>Aucune parcelle enregistree.</Text>}

      {parcelles.map((parcelle) => {
        const lat = Number(parcelle.latitude);
        const lng = Number(parcelle.longitude);
        return (
          <View key={parcelle.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{parcelle.name}</Text>
              <CultureBadge culture={parcelle.culture} />
            </View>
            <View style={styles.cardRow}><Text style={styles.cardLabel}>Surface</Text><Text style={styles.cardValue}>{parcelle.surface_ha || '-'} ha</Text></View>
            {Number.isFinite(lat) && Number.isFinite(lng) && (
              <View style={styles.cardRow}><Text style={styles.cardLabel}>Centre</Text><Text style={styles.cardValue}>{lat.toFixed(4)}, {lng.toFixed(4)}</Text></View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  action: { color: '#21543d', fontWeight: '700' },
  mapCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#e0d8c7', backgroundColor: '#fffdf8', height: 360 },
  map: { flex: 1, backgroundColor: '#fffdf8' },
  helper: { color: '#6c776d', fontSize: 13 },
  empty: { color: '#6c776d', fontSize: 14, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fffdf8', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#e0d8c7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#1d2a1e', fontSize: 16, fontWeight: '800' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 8 },
  cardLabel: { color: '#677267', fontWeight: '600' },
  cardValue: { color: '#1d2a1e', fontWeight: '700' },
  drawPanel: { gap: 10 },
  drawButton: { borderWidth: 1, borderColor: '#d9cdb7', backgroundColor: '#fffdf8', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  drawButtonActive: { backgroundColor: '#21543d', borderColor: '#21543d' },
  drawButtonText: { color: '#4d5a4d', fontWeight: '700' },
  drawButtonTextActive: { color: '#fffdf8' },
  drawActionsRow: { flexDirection: 'row', gap: 10 },
  drawAction: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', backgroundColor: '#e8e1d3' },
  drawActionText: { color: '#4d5a4d', fontWeight: '700' },
  saveButton: { backgroundColor: '#c96c2d', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#d8c4b3' },
  saveButtonText: { color: '#fffaf5', fontWeight: '800' },
  formPanel: { backgroundColor: '#fffdf8', borderRadius: 18, borderWidth: 1, borderColor: '#e0d8c7', padding: 16, gap: 8 },
  formTitle: { color: '#1d2a1e', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  formLabel: { color: '#677267', fontWeight: '600', fontSize: 13 },
  formInput: { borderWidth: 1, borderColor: '#e0d8c7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1d2a1e', backgroundColor: '#fbf6ea' },
  formHelper: { color: '#6c776d', fontSize: 13, marginTop: 4 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  formAction: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  formActionGhost: { backgroundColor: '#e8e1d3' },
  formActionGhostText: { color: '#4d5a4d', fontWeight: '700' },
  formActionPrimary: { backgroundColor: '#21543d' },
  formActionPrimaryText: { color: '#fffaf5', fontWeight: '800' },
  formActionDisabled: { opacity: 0.6 },
});
