import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import StatCard from '../components/StatCard';
import DiagnosticCard from '../../diagnostics/components/DiagnosticCard';

export default function DashboardScreen({ user, parcelles, diagnostics, refreshing, onRefresh, onViewAllDiagnostics }) {
  const elevatedCount = diagnostics.filter((d) => d.niveau_risque === 'Élevé').length;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <StatCard label="Parcelles" value={parcelles.length} />
        <StatCard label="Diagnostics" value={diagnostics.length} />
        <StatCard label="Risque eleve" value={elevatedCount} accent="#9f2f1f" />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes parcelles</Text>
          <Pressable onPress={onRefresh} disabled={refreshing}>
            <Text style={styles.inlineAction}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
          </Pressable>
        </View>
        {parcelles.map((parcelle) => (
          <View key={parcelle.id} style={styles.parcelleRow}>
            <View>
              <Text style={styles.parcelleTitle}>{parcelle.name}</Text>
              <Text style={styles.parcelleMeta}>{parcelle.culture} | {parcelle.surface_ha} ha</Text>
            </View>
            <Text style={styles.parcelleCoords}>
              {Number(parcelle.latitude).toFixed(2)}, {Number(parcelle.longitude).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Derniers diagnostics</Text>
          <Pressable onPress={onViewAllDiagnostics}>
            <Text style={styles.inlineAction}>Voir tout</Text>
          </Pressable>
        </View>
        {diagnostics.slice(0, 3).map((d) => <DiagnosticCard key={d.id} diagnostic={d} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  statsRow: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  inlineAction: { color: '#21543d', fontWeight: '700' },
  parcelleRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee7d8', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  parcelleTitle: { color: '#213123', fontSize: 16, fontWeight: '700' },
  parcelleMeta: { color: '#677267', marginTop: 4 },
  parcelleCoords: { color: '#7a847b', fontSize: 12, maxWidth: 110, textAlign: 'right' },
});
