import { StyleSheet, Text, View } from 'react-native';
import RiskBadge from './RiskBadge';
import { formatDate } from '../../../shared/utils/date';

export default function DiagnosticCard({ diagnostic }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{diagnostic.maladie_detectee}</Text>
          <Text style={styles.meta}>
            {diagnostic.parcelle_name || 'Parcelle non rattachee'} | {formatDate(diagnostic.created_at)}
          </Text>
        </View>
        <RiskBadge value={diagnostic.niveau_risque} />
      </View>
      <Text style={styles.advice}>{diagnostic.conseil}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 14, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, gap: 4 },
  title: { color: '#1d2a1e', fontSize: 16, fontWeight: '700' },
  meta: { color: '#677267', fontSize: 12 },
  advice: { color: '#374238', lineHeight: 21 },
});
