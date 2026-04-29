import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import StatCard from '../../dashboard/components/StatCard';
import DiagnosticCard from '../components/DiagnosticCard';

export default function DiagnosticsScreen({ diagnostics, parcelles, selectedParcelleId, onSelectParcelle, refreshing, onRefresh }) {
  const elevatedCount = diagnostics.filter((d) => d.niveau_risque === 'Élevé').length;
  const filtered = selectedParcelleId
    ? diagnostics.filter((d) => d.parcelle_id === selectedParcelleId)
    : diagnostics;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <StatCard label="Total" value={diagnostics.length} />
        <StatCard label="Risque eleve" value={elevatedCount} accent="#9f2f1f" />
        <StatCard label="Sans souci" value={diagnostics.filter((d) => d.niveau_risque === 'Aucun').length} accent="#21543d" />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Filtrer par parcelle</Text>
          <Pressable onPress={() => onSelectParcelle(null)}>
            <Text style={styles.inlineAction}>Tout</Text>
          </Pressable>
        </View>
        <View style={styles.pillRow}>
          {parcelles.map((parcelle) => {
            const active = selectedParcelleId === parcelle.id;
            return (
              <Pressable
                key={parcelle.id}
                style={[styles.pill, active ? styles.pillActive : null]}
                onPress={() => onSelectParcelle(active ? null : parcelle.id)}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{parcelle.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <Pressable onPress={onRefresh} disabled={refreshing}>
            <Text style={styles.inlineAction}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
          </Pressable>
        </View>
        {filtered.map((d) => <DiagnosticCard key={d.id} diagnostic={d} />)}
        {filtered.length === 0 && <Text style={styles.empty}>Aucun diagnostic enregistre.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
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
  empty: { color: '#6c776d', fontSize: 16, textAlign: 'center', marginTop: 8 },
});
