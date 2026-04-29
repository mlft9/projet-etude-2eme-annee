import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import * as Location from 'expo-location';
import { createParcelle, updateParcelle, deleteParcelle, fetchCapteurs, associateCapteur, fetchCapteursForParcelle } from '../../../shared/services/api';
import { normalizePolygon, computeSurfaceHa } from '../../../shared/utils/geo';
import CultureBadge from '../components/CultureBadge';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const DEFAULT_CENTER = { latitude: 48.086, longitude: -1.617, zoom: 14 };
const CAPTEUR_RADIUS_M = 50;
const CAPTEUR_COVERAGE_M2 = Math.PI * CAPTEUR_RADIUS_M * CAPTEUR_RADIUS_M * 0.9;

function recommendedCapteurs(surfaceHa) {
  return Math.max(1, Math.ceil((surfaceHa * 10000) / CAPTEUR_COVERAGE_M2));
}

function escHtml(str) {
  return String(str || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
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
      .capteur-popup { font-family: sans-serif; font-size: 13px; min-width: 160px; }
      .capteur-popup h3 { margin: 0 0 4px; font-size: 15px; color: #1d2a1e; }
      .capteur-popup .meta { color: #677267; margin-bottom: 6px; }
      .capteur-popup hr { border: none; border-top: 1px solid #e0d8c7; margin: 6px 0; }
      .capteur-popup .capteur-block { margin-bottom: 6px; }
      .capteur-popup .capteur-name { font-weight: 700; color: #21543d; }
      .capteur-popup .capteur-vals { color: #1d2a1e; margin-top: 2px; }
      .capteur-popup .no-data { color: #9aa49a; font-style: italic; }
    </style>
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

        var centLat = coords.reduce(function(s, c) { return s + c[0]; }, 0) / coords.length;
        var centLng = coords.reduce(function(s, c) { return s + c[1]; }, 0) / coords.length;

        var capteurs = poly.capteurs || [];

        var popupHtml = '<div class="capteur-popup">';
        popupHtml += '<h3>' + poly.name + '</h3>';
        popupHtml += '<div class="meta">' + (poly.culture ? poly.culture + ' &mdash; ' : '') + (poly.surface_ha || '-') + ' ha</div>';

        if (capteurs.length > 0) {
          popupHtml += '<hr/>';
          capteurs.forEach(function(c) {
            popupHtml += '<div class="capteur-block">';
            popupHtml += '<div class="capteur-name">' + c.name + '</div>';
            if (c.latest) {
              popupHtml += '<div class="capteur-vals">';
              popupHtml += '&#127777; ' + c.latest.temperature + '&deg;C &nbsp; ';
              popupHtml += '&#128167; ' + c.latest.humidite + '% &nbsp; ';
              popupHtml += '&#127783; ' + c.latest.pluviometrie + 'mm';
              popupHtml += '</div>';
            } else {
              popupHtml += '<div class="no-data">Aucun releve</div>';
            }
            popupHtml += '</div>';
          });
        }
        popupHtml += '</div>';

        L.polygon(coords, { color: '#21543d', fillColor: '#21543d', fillOpacity: 0.2, weight: 2 })
          .addTo(savedLayer)
          .bindPopup(popupHtml, { maxWidth: 260 });

        if (capteurs.length > 0) {
          var latMin = Math.min.apply(null, coords.map(function(c) { return c[0]; }));
          var latMax = Math.max.apply(null, coords.map(function(c) { return c[0]; }));
          var lngMin = Math.min.apply(null, coords.map(function(c) { return c[1]; }));
          var lngMax = Math.max.apply(null, coords.map(function(c) { return c[1]; }));
          var latRange = latMax - latMin;
          var lngRange = lngMax - lngMin;
          var majorIsLat = latRange >= lngRange;

          capteurs.forEach(function(c, idx) {
            var pos;
            if (capteurs.length === 1) {
              pos = [centLat, centLng];
            } else {
              var t = 0.2 + (0.6 * idx) / (capteurs.length - 1);
              if (majorIsLat) {
                pos = [latMin + t * latRange, centLng];
              } else {
                pos = [centLat, lngMin + t * lngRange];
              }
            }
            L.circle(pos, { radius: 50, color: '#c96c2d', fillColor: '#c96c2d', fillOpacity: 0.08, weight: 1.5, dashArray: '5 4', interactive: false })
              .addTo(savedLayer);
            L.circle(pos, { radius: 8, color: '#c96c2d', fillColor: '#c96c2d', fillOpacity: 1, weight: 2, interactive: false })
              .addTo(savedLayer);
          });
        }
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
  const [capteursList, setCapteursList] = useState([]);
  const [capteursByParcelle, setCapteursByParcelle] = useState({});
  const [selectedCapteurIds, setSelectedCapteurIds] = useState([]);

  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCulture, setFormCulture] = useState('');
  const [editingParcelle, setEditingParcelle] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCulture, setEditCulture] = useState('');
  const { height: screenHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const webviewRef = useRef(null);
  const iframeRef = useRef(null);
  const mapReadyRef = useRef(false);
  const pendingCenterRef = useRef(null);

  useEffect(() => {
    loadCapteurs();
  }, []);

  useEffect(() => {
    if (!parcelles.length) return;
    loadCapteursByParcelle();
  }, [parcelles]);

  async function loadCapteurs() {
    try {
      const data = await fetchCapteurs(token);
      setCapteursList(data);
    } catch {}
  }

  async function loadCapteursByParcelle() {
    try {
      const results = await Promise.all(
        parcelles.map(async (p) => {
          try {
            const capteurs = await fetchCapteursForParcelle(token, p.id);
            return [p.id, capteurs];
          } catch {
            return [p.id, []];
          }
        })
      );
      setCapteursByParcelle(Object.fromEntries(results));
    } catch {}
  }

  const savedPolygons = useMemo(() =>
    parcelles.map((p) => {
      const points = normalizePolygon(p.geometry);
      if (!points) return null;
      const capteurs = (capteursByParcelle[p.id] || []).map((c) => ({
        id: c.id,
        name: escHtml(c.name),
        latest: c.latest ? {
          temperature: c.latest.temperature,
          humidite: c.latest.humidite,
          pluviometrie: c.latest.pluviometrie,
        } : null,
      }));
      return {
        id: p.id,
        name: String(p.name || '').replace(/[<>]/g, ''),
        culture: String(p.culture || '').replace(/[<>]/g, ''),
        surface_ha: p.surface_ha,
        points,
        capteurs,
      };
    }).filter(Boolean),
  [parcelles, capteursByParcelle]);

  const initialHtml = useMemo(() => buildLeafletHtml({ center: DEFAULT_CENTER, savedPolygons }), [savedPolygons]);

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

  function toggleCapteurSelection(id) {
    setSelectedCapteurIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    );
  }

  async function handleSave() {
    const name = formName.trim();
    if (!name) { Alert.alert('Nom requis', 'Donne un nom a la parcelle.'); return; }
    if (points.length < 3) { Alert.alert('Polygone incomplet', 'Place au moins 3 points.'); return; }
    setSaving(true);
    try {
      const parcelle = await createParcelle(token, { name, culture: formCulture.trim() || null, surface_ha: Number(computeSurfaceHa(points).toFixed(2)), geometry: points });
      if (selectedCapteurIds.length > 0) {
        await Promise.all(selectedCapteurIds.map((id) => associateCapteur(token, id, parcelle.id)));
        await loadCapteurs();
      }
      setFormOpen(false); setDrawMode(false); setSelectedCapteurIds([]);
      postToMap({ type: 'setDrawMode', value: false });
      postToMap({ type: 'clear' });
      if (onRefresh) await onRefresh();
    } catch (error) {
      Alert.alert('Sauvegarde impossible', error.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(parcelle) {
    setEditingParcelle(parcelle);
    setEditName(parcelle.name);
    setEditCulture(parcelle.culture || '');
    const currentIds = (capteursByParcelle[parcelle.id] || []).map((c) => c.id);
    setSelectedCapteurIds(currentIds);
  }

  async function handleEditSave() {
    const name = editName.trim();
    if (!name) { Alert.alert('Nom requis', 'Donne un nom à la parcelle.'); return; }
    setSaving(true);
    try {
      await updateParcelle(token, editingParcelle.id, { name, culture: editCulture.trim() || null });

      const originalIds = (capteursByParcelle[editingParcelle.id] || []).map((c) => c.id);
      const toAdd = selectedCapteurIds.filter((id) => !originalIds.includes(id));
      const toRemove = originalIds.filter((id) => !selectedCapteurIds.includes(id));
      await Promise.all([
        ...toAdd.map((id) => associateCapteur(token, id, editingParcelle.id)),
        ...toRemove.map((id) => associateCapteur(token, id, null)),
      ]);
      if (toAdd.length || toRemove.length) await loadCapteurs();

      setEditingParcelle(null);
      setSelectedCapteurIds([]);
      if (onRefresh) await onRefresh();
    } catch (error) {
      Alert.alert('Modification impossible', error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(parcelle) {
    Alert.alert(
      'Supprimer la parcelle',
      `Supprimer "${parcelle.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteParcelle(token, parcelle.id);
              if (onRefresh) await onRefresh();
            } catch (error) {
              Alert.alert('Suppression impossible', error.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const surfaceHa = computeSurfaceHa(points);
  const nbCapteursReco = recommendedCapteurs(surfaceHa);
  const freeCapteurs = capteursList.filter((c) => !c.parcelle_id);
  const editCapteurs = editingParcelle
    ? capteursList.filter((c) => !c.parcelle_id || c.parcelle_id === editingParcelle.id)
    : freeCapteurs;

  return (
    <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parcelles</Text>
        <Pressable onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.action}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
        </Pressable>
      </View>

      <View style={[styles.mapCard, { height: Math.round(screenHeight * 0.55) }]}>
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
          onPress={() => { if (points.length < 3) { Alert.alert('Polygone incomplet', 'Place au moins 3 points.'); return; } setFormName(''); setFormCulture(''); setSelectedCapteurIds([]); setFormOpen(true); }}
          disabled={points.length < 3}>
          <Text style={styles.saveButtonText}>Enregistrer la parcelle ({points.length} point{points.length > 1 ? 's' : ''})</Text>
        </Pressable>
        <Text style={styles.helper}>Appuie sur la carte pour ajouter un point. Appuie sur un point pour le supprimer.</Text>
      </View>

      {/* Modal création / édition */}
      <Modal
        visible={formOpen || !!editingParcelle}
        transparent
        animationType="fade"
        onRequestClose={() => { setFormOpen(false); setEditingParcelle(null); }}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!saving) { setFormOpen(false); setEditingParcelle(null); } }} />
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalCard} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingParcelle ? 'Modifier la parcelle' : 'Nouvelle parcelle'}</Text>

            <View style={styles.modalField}>
              <Text style={styles.formLabel}>Nom</Text>
              <TextInput
                style={styles.formInput}
                value={editingParcelle ? editName : formName}
                onChangeText={editingParcelle ? setEditName : setFormName}
                placeholder={editingParcelle ? 'Nom de la parcelle' : 'Ex: Parcelle Nord'}
                placeholderTextColor="#9aa49a"
                autoFocus
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.formLabel}>Culture (optionnel)</Text>
              <TextInput
                style={styles.formInput}
                value={editingParcelle ? editCulture : formCulture}
                onChangeText={editingParcelle ? setEditCulture : setFormCulture}
                placeholder="Ex: Blé tendre"
                placeholderTextColor="#9aa49a"
              />
            </View>

            {formOpen && !editingParcelle && (
              <Text style={styles.formHelper}>
                Surface estimée : {surfaceHa.toFixed(2)} ha &mdash; {nbCapteursReco} capteur{nbCapteursReco > 1 ? 's' : ''} recommandé{nbCapteursReco > 1 ? 's' : ''}
              </Text>
            )}

            <View style={styles.modalField}>
              <Text style={styles.formLabel}>Capteurs associés</Text>
              {editCapteurs.length === 0 ? (
                <Text style={styles.noCapteurHint}>Aucun capteur disponible. Créez-en dans Compte.</Text>
              ) : (
                editCapteurs.map((c) => {
                  const selected = selectedCapteurIds.includes(c.id);
                  return (
                    <Pressable key={c.id} style={[styles.capteurItem, selected && styles.capteurItemSelected]} onPress={() => toggleCapteurSelection(c.id)}>
                      <View style={[styles.capteurCheck, selected && styles.capteurCheckSelected]}>
                        {selected && <Text style={styles.capteurCheckMark}>✓</Text>}
                      </View>
                      <View>
                        <Text style={[styles.capteurItemName, selected && styles.capteurItemNameSelected]}>{c.name}</Text>
                        {c.serial_number ? <Text style={styles.capteurItemSerial}>N° {c.serial_number}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            <View style={styles.formActions}>
              <Pressable style={[styles.formAction, styles.formActionGhost]} onPress={() => { setFormOpen(false); setEditingParcelle(null); }} disabled={saving}>
                <Text style={styles.formActionGhostText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.formAction, styles.formActionPrimary, saving && styles.formActionDisabled]} onPress={editingParcelle ? handleEditSave : handleSave} disabled={saving}>
                <Text style={styles.formActionPrimaryText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {parcelles.length === 0 && <Text style={styles.empty}>Aucune parcelle enregistree.</Text>}

      {parcelles.map((parcelle) => {
        const lat = Number(parcelle.latitude);
        const lng = Number(parcelle.longitude);
        const capteurs = capteursByParcelle[parcelle.id] || [];
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

            {capteurs.length > 0 && (
              <View style={styles.capteursSection}>
                <Text style={styles.capteursSectionTitle}>Capteurs ({capteurs.length})</Text>
                {capteurs.map((c) => (
                  <View key={c.id} style={styles.capteurCard}>
                    <Text style={styles.capteurCardName}>{c.name}</Text>
                    {c.latest ? (
                      <View style={styles.capteurVals}>
                        <View style={styles.capteurVal}><Text style={styles.capteurValLabel}>Temp.</Text><Text style={styles.capteurValValue}>{Number(c.latest.temperature).toFixed(1)}°C</Text></View>
                        <View style={styles.capteurVal}><Text style={styles.capteurValLabel}>Humid.</Text><Text style={styles.capteurValValue}>{Number(c.latest.humidite).toFixed(1)}%</Text></View>
                        <View style={styles.capteurVal}><Text style={styles.capteurValLabel}>Pluie</Text><Text style={styles.capteurValValue}>{Number(c.latest.pluviometrie).toFixed(1)} mm</Text></View>
                      </View>
                    ) : (
                      <Text style={styles.capteurNoData}>Aucun relevé disponible</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.cardActions}>
              <Pressable style={styles.cardActionEdit} onPress={() => openEdit(parcelle)}><Text style={styles.cardActionEditText}>Modifier</Text></Pressable>
              <Pressable style={styles.cardActionDelete} onPress={() => handleDelete(parcelle)}><Text style={styles.cardActionDeleteText}>Supprimer</Text></Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>

      {deleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color="#21543d" />
          <Text style={styles.deletingText}>Suppression...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  action: { color: '#21543d', fontWeight: '700' },
  mapCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#e0d8c7', backgroundColor: '#fffdf8' },
  map: { flex: 1, backgroundColor: '#fffdf8' },
  helper: { color: '#6c776d', fontSize: 13 },
  empty: { color: '#6c776d', fontSize: 14, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fffdf8', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#e0d8c7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#1d2a1e', fontSize: 16, fontWeight: '800' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 8 },
  cardLabel: { color: '#677267', fontWeight: '600' },
  cardValue: { color: '#1d2a1e', fontWeight: '700' },
  capteursSection: { borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 10, gap: 8 },
  capteursSectionTitle: { color: '#677267', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  capteurCard: { backgroundColor: '#f5f2ea', borderRadius: 12, padding: 10, gap: 6 },
  capteurCardName: { color: '#21543d', fontWeight: '700', fontSize: 13 },
  capteurVals: { flexDirection: 'row', gap: 10 },
  capteurVal: { alignItems: 'center', flex: 1, backgroundColor: '#fffdf8', borderRadius: 8, padding: 6 },
  capteurValLabel: { color: '#677267', fontSize: 11, fontWeight: '600' },
  capteurValValue: { color: '#1d2a1e', fontSize: 14, fontWeight: '800' },
  capteurNoData: { color: '#9aa49a', fontSize: 12, fontStyle: 'italic' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29, 42, 30, 0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalScroll: { maxHeight: '85%' },
  modalCard: { backgroundColor: '#fffdf8', borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: '#e0d8c7', elevation: 8 },
  modalTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  modalField: { gap: 8 },
  formLabel: { color: '#677267', fontWeight: '600', fontSize: 13 },
  formInput: { borderWidth: 1, borderColor: '#e0d8c7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1d2a1e', backgroundColor: '#fbf6ea' },
  formHelper: { color: '#21543d', fontSize: 13, fontWeight: '600', marginTop: 2 },
  noCapteurHint: { color: '#9aa49a', fontSize: 13, fontStyle: 'italic' },
  capteurItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e0d8c7', backgroundColor: '#fbf6ea' },
  capteurItemSelected: { borderColor: '#21543d', backgroundColor: '#edf5f0' },
  capteurCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d9cdb7', alignItems: 'center', justifyContent: 'center' },
  capteurCheckSelected: { borderColor: '#21543d', backgroundColor: '#21543d' },
  capteurCheckMark: { color: '#fffdf8', fontSize: 13, fontWeight: '800' },
  capteurItemName: { color: '#1d2a1e', fontWeight: '700', fontSize: 14 },
  capteurItemNameSelected: { color: '#21543d' },
  capteurItemSerial: { color: '#677267', fontSize: 12 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  formAction: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  formActionGhost: { backgroundColor: '#e8e1d3' },
  formActionGhostText: { color: '#4d5a4d', fontWeight: '700' },
  formActionPrimary: { backgroundColor: '#21543d' },
  formActionPrimaryText: { color: '#fffaf5', fontWeight: '800' },
  formActionDisabled: { opacity: 0.6 },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 10, marginTop: 2 },
  cardActionEdit: { flex: 1, backgroundColor: '#e8e1d3', borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  cardActionEditText: { color: '#4d5a4d', fontWeight: '700', fontSize: 14 },
  cardActionDelete: { flex: 1, backgroundColor: '#f5e8e3', borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  cardActionDeleteText: { color: '#9f2f1f', fontWeight: '700', fontSize: 14 },
  deletingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(243, 240, 232, 0.85)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  deletingText: { color: '#1d2a1e', fontSize: 15, fontWeight: '700' },
});
