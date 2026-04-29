import { Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import StatCard from '../../dashboard/components/StatCard';
import DiagnosticCard from '../components/DiagnosticCard';

export default function DiagnosticsScreen({ diagnostics, parcelles, selectedParcelleId, onSelectParcelle, refreshing, onRefresh, onViewPlant, onOpenPlantLibrary, onOpenDiagnostic }) {
  const [parcelleQuery, setParcelleQuery] = useState('');
  const [diagnosticQuery, setDiagnosticQuery] = useState('');

  const elevatedCount = diagnostics.filter((d) => d.niveau_risque === 'Élevé').length;

  const filtered = selectedParcelleId
    ? diagnostics.filter((d) => d.parcelle_id === selectedParcelleId)
    : diagnostics;

  const filteredParcelles = useMemo(() => {
    const q = parcelleQuery.trim().toLowerCase();
    return parcelles.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.culture || '').toLowerCase().includes(q));
  }, [parcelleQuery, parcelles]);

  const filteredDiagnostics = useMemo(() => {
    const q = diagnosticQuery.trim().toLowerCase();
    return filtered.filter((d) => !q || (d.maladie_detectee || '').toLowerCase().includes(q) || (d.parcelle_name || '').toLowerCase().includes(q));
  }, [diagnosticQuery, filtered]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Diagnostics</Text>
        <Pressable style={styles.catalogButton} onPress={onOpenPlantLibrary}>
          <Text style={styles.catalogButtonText}>Bibliotheque plantes</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={diagnostics.length} />
        <StatCard label="Risque eleve" value={elevatedCount} accent="#9f2f1f" />
        <StatCard label="Sans souci" value={diagnostics.filter((d) => d.niveau_risque === 'Aucun').length} accent="#21543d" />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes parcelles</Text>
          <Pressable onPress={() => onSelectParcelle(null)}>
            <Text style={styles.inlineAction}>Tout</Text>
          </Pressable>
        </View>
        <TextInput placeholder="Rechercher une parcelle ou culture" value={parcelleQuery} onChangeText={setParcelleQuery} style={styles.searchInput} />
        <View style={{ gap: 10 }}>
          {filteredParcelles.map((parcelle) => (
            <View key={parcelle.id} style={styles.parcelleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.parcelleTitle}>{parcelle.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {parcelle.culture ? (
                    <Text style={styles.parcelleMetaLink}>{parcelle.culture}</Text>
                  ) : null}
                  <Text style={styles.parcelleMeta}>| {parcelle.surface_ha} ha</Text>
                </View>
              </View>
              <Text style={styles.parcelleCoords}>{parcelle.latitude ? `${Number(parcelle.latitude).toFixed(5)}, ${Number(parcelle.longitude).toFixed(5)}` : '—'}</Text>
            </View>
          ))}
          {filteredParcelles.length === 0 && <Text style={styles.empty}>Aucune parcelle trouvee.</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <Pressable onPress={onRefresh} disabled={refreshing}>
            <Text style={styles.inlineAction}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
          </Pressable>
        </View>
        <TextInput placeholder="Rechercher un diagnostic ou parcelle" value={diagnosticQuery} onChangeText={setDiagnosticQuery} style={styles.searchInput} />
        {filteredDiagnostics.map((d) => (
          <Pressable key={d.id} onPress={() => onOpenDiagnostic && onOpenDiagnostic(d)}>
            <DiagnosticCard diagnostic={d} onViewPlant={onViewPlant} />
          </Pressable>
        ))}
        {filteredDiagnostics.length === 0 && <Text style={styles.empty}>Aucun diagnostic enregistre.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { color: '#1d2a1e', fontSize: 22, fontWeight: '800' },
  catalogButton: { backgroundColor: '#21543d', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  catalogButtonText: { color: '#fffdf8', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  inlineAction: { color: '#21543d', fontWeight: '700', fontSize: 16, paddingVertical: 8, paddingHorizontal: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: '#ece3d5', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 16 },
  pillActive: { backgroundColor: '#21543d' },
  pillText: { color: '#506052', fontWeight: '700', fontSize: 15 },
  pillTextActive: { color: '#fffdf8' },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6, borderWidth: 1, borderColor: '#e8e3d6', fontSize: 13 },
  parcelleRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eee7d8', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  parcelleTitle: { color: '#213123', fontSize: 16, fontWeight: '700' },
  parcelleMeta: { color: '#677267', marginTop: 4, fontSize: 13 },
  parcelleMetaLink: { color: '#c96c2d', marginTop: 4, fontSize: 13, fontWeight: '700' },
  parcelleCoords: { color: '#7a847b', fontSize: 13, maxWidth: 140, textAlign: 'right' },
  empty: { color: '#6c776d', fontSize: 16, textAlign: 'center', marginTop: 8 },
});
