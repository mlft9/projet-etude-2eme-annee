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
          <Text style={styles.sectionTitle} numberOfLines={1}>Mes parcelles</Text>
          <Pressable onPress={onRefresh} disabled={refreshing} style={styles.inlineActionBtn}>
            <Text style={styles.inlineAction}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
          </Pressable>
        </View>
        {parcelles.map((parcelle) => (
          <View key={parcelle.id} style={styles.parcelleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.parcelleTitle}>{parcelle.name}</Text>
              <Text style={styles.parcelleMeta}>{parcelle.culture || 'Culture non renseignee'}</Text>
            </View>
            <Text style={styles.parcelleCoords}>
              {parcelle.latitude != null && parcelle.longitude != null
                ? `${Number(parcelle.latitude).toFixed(5)}, ${Number(parcelle.longitude).toFixed(5)}`
                : '—'}
            </Text>
          </View>
        ))}
        {parcelles.length === 0 && <Text style={styles.parcelleMeta}>Aucune parcelle enregistree.</Text>}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Derniers diagnostics</Text>
          <Pressable onPress={onViewAllDiagnostics}>
            <Text style={styles.inlineAction}>Voir tout</Text>
          </Pressable>
        </View>
        {diagnostics.slice(0, 4).map((d) => <DiagnosticCard key={d.id} diagnostic={d} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  statsRow: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800', flex: 1 },
  inlineActionBtn: { flexShrink: 0 },
  inlineAction: { color: '#21543d', fontWeight: '700', fontSize: 16, paddingVertical: 8, paddingHorizontal: 10 },
  parcelleRow: { paddingVertical: 18, borderTopWidth: 1, borderTopColor: '#eee7d8', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  parcelleTitle: { color: '#213123', fontSize: 17, fontWeight: '700' },
  parcelleMeta: { color: '#677267', marginTop: 4, fontSize: 14 },
  parcelleMetaLink: { color: '#c96c2d', marginTop: 4, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  parcelleCoords: { color: '#7a847b', fontSize: 14, maxWidth: 110, textAlign: 'right' },
});
