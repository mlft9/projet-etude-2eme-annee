import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { alertFarmers } from '../../../shared/services/api';
import RiskBadge from '../components/RiskBadge';
import { formatDate } from '../../../shared/utils/date';

export default function DiagnosticDetailScreen({ diagnostic, token, onBack }) {
  const [sending, setSending] = useState(false);

  async function handleAlert() {
    Alert.prompt(
      'Alerter les agriculteurs',
      'Renseignez un message pour les autres agriculteurs (optionnel)',
      async (message) => {
        setSending(true);
        try {
          await alertFarmers(token, diagnostic.id, { message });
          Alert.alert('Alerte envoyee', "Les agriculteurs proches seront informes via l'application.");
        } catch (err) {
          Alert.alert('Erreur', err.message);
        } finally {
          setSending(false);
        }
      }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{diagnostic.maladie_detectee}</Text>
        <RiskBadge value={diagnostic.niveau_risque} />
      </View>

      <Text style={styles.meta}>{diagnostic.parcelle_name || 'Parcelle non rattachee'} | {formatDate(diagnostic.created_at)}</Text>
      <Text style={styles.meta}>Localisation: {diagnostic.latitude ? `${Number(diagnostic.latitude).toFixed(5)}, ${Number(diagnostic.longitude).toFixed(5)}` : '—'}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conseil</Text>
        <Text style={styles.advice}>{diagnostic.conseil}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Confiance IA</Text>
        <Text style={styles.confidence}>{diagnostic.score_confiance != null ? `${diagnostic.score_confiance}%` : '—'}</Text>
      </View>

      <Pressable style={styles.alertButton} onPress={handleAlert} disabled={sending}>
        <Text style={styles.alertButtonText}>{sending ? 'Envoi...' : "Alerter les agriculteurs"}</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#1d2a1e', fontSize: 22, fontWeight: '800' },
  meta: { color: '#6c776d' , fontSize: 14},
  card: { backgroundColor: '#fffdf8', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionTitle: { fontWeight: '800', color: '#213123', marginBottom: 8 },
  advice: { color: '#374238', lineHeight: 22 },
  confidence: { color: '#6c776d', fontWeight: '700' },
  alertButton: { backgroundColor: '#c93b2f', padding: 14, borderRadius: 12, alignItems: 'center' , marginTop: 10},
  alertButtonText: { color: '#fffdf8', fontWeight: '800' },
  backButton: { padding: 12, alignItems: 'center' },
  backButtonText: { color: '#21543d', fontWeight: '700' },
});
