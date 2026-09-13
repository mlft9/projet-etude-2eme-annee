import { Pressable, ScrollView, StyleSheet, Text, View, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import StatCard from '../../dashboard/components/StatCard';
import DiagnosticCard from '../components/DiagnosticCard';
import { Ionicons } from '@expo/vector-icons';

export default function DiagnosticsScreen({ diagnostics, parcelles, betail = [], selectedParcelleId, onSelectParcelle, refreshing, onRefresh, onOpenPlantLibrary, onViewPlant, onOpenDiagnostic }) {
  const [parcelleQuery, setParcelleQuery] = useState('');
  const [diagnosticQuery, setDiagnosticQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'Élevé', 'Aucun', 'Moyen'
  const [historyModalParcelle, setHistoryModalParcelle] = useState(null);

  const elevatedCount = diagnostics.filter((d) => d.niveau_risque === 'Élevé').length;
  const noRiskCount = diagnostics.filter((d) => d.niveau_risque === 'Aucun').length;
  const moyenCount = diagnostics.filter((d) => d.niveau_risque === 'Moyen').length;

  const filtered = selectedParcelleId
    ? diagnostics.filter((d) => d.parcelle_id === selectedParcelleId)
    : diagnostics;

  const filteredParcelles = useMemo(() => {
    const q = parcelleQuery.trim().toLowerCase();
    let result = parcelles.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.culture || '').toLowerCase().includes(q));
    
    if (activeFilter !== 'all') {
      result = result.filter(p => {
        // Find if this parcelle has any diagnostic with the activeFilter level
        return diagnostics.some(d => d.parcelle_id === p.id && d.niveau_risque === activeFilter);
      });
    }
    return result;
  }, [parcelleQuery, parcelles, activeFilter, diagnostics]);

  const filteredDiagnostics = useMemo(() => {
    const q = diagnosticQuery.trim().toLowerCase();
    let result = filtered.filter((d) => !q || (d.maladie_detectee || '').toLowerCase().includes(q) || (d.parcelle_name || '').toLowerCase().includes(q));
    if (activeFilter !== 'all') {
      result = result.filter(d => d.niveau_risque === activeFilter);
    }
    return result;
  }, [diagnosticQuery, filtered, activeFilter]);

  const modalDiagnostics = useMemo(() => {
    if (!historyModalParcelle) return [];
    return diagnostics.filter(d => d.parcelle_id === historyModalParcelle.id);
  }, [historyModalParcelle, diagnostics]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Diagnostics</Text>
          <Pressable style={styles.catalogButton} onPress={onOpenPlantLibrary}>
            <Text style={styles.catalogButtonText}>Bibliothèque Agricole</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total" value={diagnostics.length} isActive={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
          <StatCard label="Risque eleve" value={elevatedCount} accent="#9f2f1f" isActive={activeFilter === 'Élevé'} onPress={() => setActiveFilter('Élevé')} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Risque modere" value={moyenCount} accent="#c96c2d" isActive={activeFilter === 'Moyen'} onPress={() => setActiveFilter('Moyen')} />
          <StatCard label="Sans souci" value={noRiskCount} accent="#21543d" isActive={activeFilter === 'Aucun'} onPress={() => setActiveFilter('Aucun')} />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique filtré</Text>
            <Pressable onPress={onRefresh} disabled={refreshing}>
              <Text style={styles.inlineAction}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
            </Pressable>
          </View>
          <TextInput placeholder="Rechercher un diagnostic ou parcelle" value={diagnosticQuery} onChangeText={setDiagnosticQuery} style={styles.searchInput} />
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={true} nestedScrollEnabled>
            <View style={{ gap: 10 }}>
              {filteredDiagnostics.map((d) => (
                <Pressable key={d.id} onPress={() => onOpenDiagnostic && onOpenDiagnostic(d)}>
                  <DiagnosticCard diagnostic={d} onViewPlant={onViewPlant} />
                </Pressable>
              ))}
              {filteredDiagnostics.length === 0 && <Text style={styles.empty}>Aucun diagnostic trouvé.</Text>}
            </View>
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes parcelles</Text>
            <Pressable onPress={() => onSelectParcelle(null)}>
              <Text style={styles.inlineAction}>Tout</Text>
            </Pressable>
          </View>
          <TextInput placeholder="Rechercher une parcelle ou culture" value={parcelleQuery} onChangeText={setParcelleQuery} style={styles.searchInput} />
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={true} nestedScrollEnabled>
            <View style={{ gap: 10 }}>
              {filteredParcelles.map((parcelle) => (
                <Pressable key={parcelle.id} style={styles.parcelleRow} onPress={() => setHistoryModalParcelle(parcelle)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.parcelleTitle}>{parcelle.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {parcelle.culture ? (
                        <Text style={styles.parcelleMetaLink}>{parcelle.culture}</Text>
                      ) : null}
                      <Text style={styles.parcelleMeta}>| {parcelle.surface_ha} ha</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.parcelleCoords}>{parcelle.latitude ? `${Number(parcelle.latitude).toFixed(5)}, ${Number(parcelle.longitude).toFixed(5)}` : '—'}</Text>
                    <Text style={styles.historyHint}>Voir historique ➔</Text>
                  </View>
                </Pressable>
              ))}
              {filteredParcelles.length === 0 && <Text style={styles.empty}>Aucune parcelle trouvee.</Text>}
            </View>
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bétail (Troupeaux)</Text>
          </View>
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={true} nestedScrollEnabled>
            <View style={{ gap: 10 }}>
              {betail.map((herd) => (
                <Pressable key={herd.id} style={styles.parcelleRow} onPress={() => Alert.alert('Historique', 'Historique bétail non implémenté pour le moment.')}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.parcelleTitle}>{herd.type}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.parcelleMetaLink}>{herd.race}</Text>
                      <Text style={styles.parcelleMeta}>| {herd.count} têtes</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.parcelleCoords}>{herd.localisation}</Text>
                    <Text style={styles.historyHint}>Voir historique ➔</Text>
                  </View>
                </Pressable>
              ))}
              {betail.length === 0 && <Text style={styles.empty}>Aucun troupeau enregistré.</Text>}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modal d'historique de la parcelle */}
      <Modal visible={!!historyModalParcelle} transparent animationType="slide" onRequestClose={() => setHistoryModalParcelle(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{historyModalParcelle?.name}</Text>
              <Pressable onPress={() => setHistoryModalParcelle(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#1d2a1e" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Culture : {historyModalParcelle?.culture || 'Non définie'}</Text>
            <Text style={styles.modalSubtitle}>Surface : {historyModalParcelle?.surface_ha} ha</Text>

            <View style={styles.modalDivider} />
            <Text style={styles.sectionTitle}>Historique des Diagnostics</Text>
            
            <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
              {modalDiagnostics.length > 0 ? (
                modalDiagnostics.map(d => (
                  <Pressable key={d.id} onPress={() => { setHistoryModalParcelle(null); if (onOpenDiagnostic) onOpenDiagnostic(d); }}>
                    <DiagnosticCard diagnostic={d} onViewPlant={onViewPlant} />
                  </Pressable>
                ))
              ) : (
                <Text style={styles.empty}>Aucun historique sanitaire pour cette parcelle.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  searchInput: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6, borderWidth: 1, borderColor: '#e8e3d6', fontSize: 13 },
  parcelleRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eee7d8', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  parcelleTitle: { color: '#213123', fontSize: 16, fontWeight: '700' },
  parcelleMeta: { color: '#677267', marginTop: 4, fontSize: 13 },
  parcelleMetaLink: { color: '#c96c2d', marginTop: 4, fontSize: 13, fontWeight: '700' },
  parcelleCoords: { color: '#7a847b', fontSize: 13, maxWidth: 140, textAlign: 'right' },
  historyHint: { color: '#21543d', fontSize: 12, fontWeight: '700', marginTop: 6 },
  empty: { color: '#6c776d', fontSize: 16, textAlign: 'center', marginTop: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29, 42, 30, 0.45)', justifyContent: 'flex-end' },
  modalCardLarge: { backgroundColor: '#f3f0e8', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '80%', elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: '#1d2a1e', fontSize: 22, fontWeight: '800' },
  modalSubtitle: { color: '#677267', fontSize: 15, fontWeight: '600' },
  closeBtn: { padding: 4 },
  modalDivider: { height: 1, backgroundColor: '#e0d8c7', marginVertical: 16 }
});
