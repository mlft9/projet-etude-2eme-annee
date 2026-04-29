import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import RiskBadge from '../components/RiskBadge';
import { formatDate } from '../../../shared/utils/date';

export default function DiagnosticResultScreen({ diagnostic, onViewAll, onGoHome }) {
  const confidence = diagnostic?.score_confiance;
  const isLowConfidence = confidence != null && confidence < 60;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Analyse terminée</Text>
        <Text style={styles.successSub}>
          {diagnostic?.parcelle_name || 'Parcelle'} · {diagnostic?.created_at ? formatDate(diagnostic.created_at) : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.diseaseRow}>
          <Text style={styles.diseaseName}>{diagnostic?.maladie_detectee || '—'}</Text>
          <RiskBadge value={diagnostic?.niveau_risque} />
        </View>

        {confidence != null && (
          <View style={styles.confidenceBlock}>
            <View style={styles.confidenceBarBg}>
              <View style={[styles.confidenceBarFill, isLowConfidence ? styles.confidenceBarLow : styles.confidenceBarOk, { width: `${confidence}%` }]} />
            </View>
            <Text style={[styles.confidenceLabel, isLowConfidence && styles.confidenceLabelLow]}>
              Confiance IA : {confidence}%{isLowConfidence ? ' — résultat affiné avec les capteurs' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recommandations</Text>
        <Text style={styles.conseil}>{diagnostic?.conseil || 'Aucune recommandation disponible.'}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={onViewAll}>
          <Text style={styles.primaryButtonText}>Voir tous les diagnostics</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onGoHome}>
          <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  successBanner: { backgroundColor: '#21543d', borderRadius: 22, padding: 24, alignItems: 'center', gap: 6 },
  successIcon: { fontSize: 36, color: '#fffdf8' },
  successTitle: { color: '#fffdf8', fontSize: 22, fontWeight: '800' },
  successSub: { color: '#a8c9af', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  diseaseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  diseaseName: { flex: 1, color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  confidenceBlock: { gap: 8 },
  confidenceBarBg: { height: 8, backgroundColor: '#e0d8c7', borderRadius: 999, overflow: 'hidden' },
  confidenceBarFill: { height: '100%', borderRadius: 999 },
  confidenceBarOk: { backgroundColor: '#21543d' },
  confidenceBarLow: { backgroundColor: '#c96c2d' },
  confidenceLabel: { color: '#6c776d', fontSize: 13, fontWeight: '600' },
  confidenceLabelLow: { color: '#c96c2d' },
  sectionTitle: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  conseil: { color: '#374238', fontSize: 15, lineHeight: 24 },
  actions: { gap: 10 },
  primaryButton: { backgroundColor: '#21543d', borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  primaryButtonText: { color: '#fffdf8', fontWeight: '800', fontSize: 16 },
  secondaryButton: { backgroundColor: '#e8e1d3', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  secondaryButtonText: { color: '#4d5a4d', fontWeight: '700', fontSize: 16 },
});
