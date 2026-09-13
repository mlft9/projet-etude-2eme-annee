import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import RiskBadge from '../components/RiskBadge';

export default function RefinementScreen({ diagnostic, initialCapteurs, submitting, onRefine, onSkip }) {
  const isAnimal = diagnostic?.type_analyse === 'animal';

  const [temperature, setTemperature] = useState(
    !isAnimal && initialCapteurs?.temperature != null ? String(initialCapteurs.temperature) : ''
  );
  const [humidite, setHumidite] = useState(
    !isAnimal && initialCapteurs?.humidite != null ? String(initialCapteurs.humidite) : ''
  );
  const [pluviometrie, setPluviometrie] = useState(
    !isAnimal && initialCapteurs?.pluviometrie != null ? String(initialCapteurs.pluviometrie) : ''
  );

  // Champs animal
  const [animalTemp, setAnimalTemp] = useState('');
  const [comportement, setComportement] = useState('');
  const [appetit, setAppetit] = useState('');

  function handleRefine() {
    if (isAnimal) {
      onRefine({
        temperature: parseFloat(animalTemp) || 0,
        comportement: comportement || 'Normal',
        appetit: appetit || 'Normal',
      });
    } else {
      onRefine({
        temperature: parseFloat(temperature),
        humidite: parseFloat(humidite),
        pluviometrie: parseFloat(pluviometrie),
      });
    }
  }

  const canRefine = isAnimal 
    ? animalTemp !== '' && comportement !== '' && appetit !== ''
    : temperature !== '' && humidite !== '' && pluviometrie !== '';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>Score de confiance faible</Text>
        <Text style={styles.alertBody}>
          L'IA est sûre à {diagnostic.score_confiance}% basé sur l'image seule. Confirme ou ajuste les
          {isAnimal ? " observations de l'animal " : " valeurs capteurs "} pour affiner le diagnostic.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Diagnostic initial</Text>
        <View style={styles.row}>
          <Text style={styles.maladie}>{diagnostic.maladie_detectee}</Text>
          <RiskBadge value={diagnostic.niveau_risque} />
        </View>
        <Text style={styles.conseil}>{diagnostic.conseil}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{isAnimal ? 'Observations Animal' : 'Données capteurs parcelle'}</Text>
        <Text style={styles.hint}>
          {isAnimal ? 'Renseigne les constantes et observations pour aider le diagnostic.' : 'Valeurs récupérées depuis le simulateur IoT — tu peux les corriger.'}
        </Text>

        {isAnimal ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Température corporelle (°C)</Text>
              <TextInput
                style={styles.input}
                value={animalTemp}
                onChangeText={setAnimalTemp}
                keyboardType="decimal-pad"
                placeholder="ex : 39.5"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Symptômes / Comportement</Text>
              <TextInput
                style={styles.input}
                value={comportement}
                onChangeText={setComportement}
                placeholder="ex : Boiterie, abattement..."
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Appétit</Text>
              <TextInput
                style={styles.input}
                value={appetit}
                onChangeText={setAppetit}
                placeholder="ex : Diminué, nul, normal"
                placeholderTextColor="#aaa"
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Température sol (°C)</Text>
              <TextInput
                style={styles.input}
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
                placeholder="ex : 22.5"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Humidité sol (%)</Text>
              <TextInput
                style={styles.input}
                value={humidite}
                onChangeText={setHumidite}
                keyboardType="decimal-pad"
                placeholder="ex : 65"
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Pluviométrie récente (mm)</Text>
              <TextInput
                style={styles.input}
                value={pluviometrie}
                onChangeText={setPluviometrie}
                keyboardType="decimal-pad"
                placeholder="ex : 5.2"
                placeholderTextColor="#aaa"
              />
            </View>
          </>
        )}
      </View>

      <Pressable style={[styles.primaryButton, (!canRefine || submitting) && styles.disabled]} onPress={handleRefine} disabled={!canRefine || submitting}>
        {submitting
          ? <ActivityIndicator color="#fffaf5" />
          : <Text style={styles.primaryButtonText}>{isAnimal ? 'Affiner avec ces observations' : 'Affiner le diagnostic avec les capteurs'}</Text>
        }
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onSkip} disabled={submitting}>
        <Text style={styles.secondaryButtonText}>Continuer sans affiner</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  alertCard: { backgroundColor: '#fff4e0', borderRadius: 16, padding: 18, gap: 8, borderWidth: 1, borderColor: '#e6c97a' },
  alertTitle: { color: '#7a4f00', fontSize: 18, fontWeight: '800' },
  alertBody: { color: '#7a4f00', fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 12, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  maladie: { color: '#1d2a1e', fontSize: 17, fontWeight: '700', flex: 1 },
  conseil: { color: '#374238', lineHeight: 23, fontSize: 15 },
  hint: { color: '#6c776d', fontSize: 14, lineHeight: 21 },
  field: { gap: 8 },
  label: { color: '#374238', fontWeight: '700', fontSize: 16 },
  input: { backgroundColor: '#f3efe6', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 18, fontSize: 17, color: '#1d2a1e', borderWidth: 1, borderColor: '#d8d0c0' },
  primaryButton: { backgroundColor: '#21543d', borderRadius: 16, paddingVertical: 22, alignItems: 'center' },
  primaryButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 17 },
  disabled: { opacity: 0.5 },
  secondaryButton: { alignItems: 'center', paddingVertical: 18 },
  secondaryButtonText: { color: '#6c776d', fontWeight: '600', fontSize: 16 },
});
