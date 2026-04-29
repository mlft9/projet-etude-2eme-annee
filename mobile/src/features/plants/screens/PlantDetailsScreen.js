import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS_DATA } from '../../../shared/data/plantsData';
import { askPlantAssistant } from '../../../shared/services/api';

export default function PlantDetailsScreen({ plant, token, onBack }) {
  const [tab, setTab] = useState('diseases'); // 'diseases' or 'pests'
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState(null);

  const normalizedPlant = String(plant || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const aliases = {
    ble: 'Blé tendre',
    bletendre: 'Blé tendre',
    'ble tendre': 'Blé tendre',
    mais: 'Maïs',
    maize: 'Maïs',
    tomate: 'Tomate',
    tomates: 'Tomate',
  };

  const matchedKey = Object.keys(PLANTS_DATA).find((key) => {
    const normalizedKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return normalizedKey === normalizedPlant;
  });

  const resolvedPlantKey = matchedKey || aliases[normalizedPlant] || plant;
  const plantData = PLANTS_DATA[resolvedPlantKey];
  if (!plantData) {
    return (
      <View style={styles.container}>
        <Text>Plant not found</Text>
      </View>
    );
  }

  const getSeverityColor = (severity) => {
    if (severity === 'Critique') return '#d32f2f';
    if (severity === 'Élevé') return '#f57c00';
    if (severity === 'Moyen') return '#fbc02d';
    return '#388e3c';
  };

  const renderDiseaseCard = (disease) => (
    <View key={disease.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{disease.name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(disease.severity) }]}>
            <Text style={styles.severityText}>{disease.severity}</Text>
          </View>
        </View>
        <Ionicons name="warning" size={24} color={getSeverityColor(disease.severity)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Symptômes</Text>
        <Text style={styles.sectionText}>{disease.symptoms}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Prévention</Text>
        <Text style={styles.sectionText}>{disease.prevention}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚗️ Traitement</Text>
        <Text style={styles.sectionText}>{disease.treatment}</Text>
      </View>
    </View>
  );

  const renderPestCard = (pest) => (
    <View key={pest.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{pest.name}</Text>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(pest.severity) }]}>
            <Text style={styles.severityText}>{pest.severity}</Text>
          </View>
        </View>
        <Ionicons name="bug" size={24} color={getSeverityColor(pest.severity)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Dégâts</Text>
        <Text style={styles.sectionText}>{pest.damage}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Prévention</Text>
        <Text style={styles.sectionText}>{pest.prevention}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Traitement</Text>
        <Text style={styles.sectionText}>{pest.treatment}</Text>
      </View>
    </View>
  );

  async function handleAskAssistant() {
    if (!question.trim()) return;
    setLoadingAnswer(true);
    try {
      const response = await askPlantAssistant(token, {
        plant_name: plantData.name,
        question: question.trim(),
        context: context.trim(),
      });
      setAssistantAnswer(response.answer || null);
    } catch (error) {
      setAssistantAnswer({
        resume: error.message,
        conseils: [],
        vigilance: [],
        prochaines_actions: [],
      });
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#21543d" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{plantData.name}</Text>
          <Text style={styles.headerSubtitle}>{plantData.description}</Text>
        </View>
      </View>

      {/* Varieties */}
      <View style={styles.varietiesContainer}>
        <Text style={styles.varietiesTitle}>📌 Variétés cultivées</Text>
        <View style={styles.varietiesList}>
          {plantData.varieties.map((v, i) => (
            <View key={i} style={styles.varietyTag}>
              <Text style={styles.varietyText}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>🌱 Spécificités de la plante</Text>
        {plantData.specificities?.map((item, index) => (
          <Text key={index} style={styles.infoLine}>• {item}</Text>
        ))}
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>💧 Besoins de la plante</Text>
        <Text style={styles.infoLine}>Eau: {plantData.needs?.water}</Text>
        <Text style={styles.infoLine}>Sol: {plantData.needs?.soil}</Text>
        <Text style={styles.infoLine}>Température: {plantData.needs?.temperature}</Text>
        <Text style={styles.infoLine}>Nutrition: {plantData.needs?.nutrition}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, tab === 'diseases' && styles.tabActive]}
          onPress={() => setTab('diseases')}
        >
          <Ionicons name="leaf" size={20} color={tab === 'diseases' ? '#21543d' : '#8a9a8b'} />
          <Text style={[styles.tabLabel, tab === 'diseases' && styles.tabLabelActive]}>
            Maladies ({plantData.diseases.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, tab === 'pests' && styles.tabActive]}
          onPress={() => setTab('pests')}
        >
          <Ionicons name="bug" size={20} color={tab === 'pests' ? '#21543d' : '#8a9a8b'} />
          <Text style={[styles.tabLabel, tab === 'pests' && styles.tabLabelActive]}>
            Nuisibles ({plantData.pests.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {tab === 'diseases' && (
          <View>
            <Text style={styles.contentTitle}>Maladies courantes</Text>
            {plantData.diseases.map(renderDiseaseCard)}
          </View>
        )}

        {tab === 'pests' && (
          <View>
            <Text style={styles.contentTitle}>Nuisibles susceptibles</Text>
            {plantData.pests.map(renderPestCard)}
          </View>
        )}

        <View style={styles.assistantCard}>
          <Text style={styles.assistantTitle}>🤖 Questionner l'IA sur {plantData.name}</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Pose une question précise (ex: risque mildiou cette semaine?)"
            placeholderTextColor="#95a196"
            multiline
          />
          <TextInput
            style={styles.input}
            value={context}
            onChangeText={setContext}
            placeholder="Contexte optionnel (météo, stade, observations)"
            placeholderTextColor="#95a196"
            multiline
          />
          <Pressable style={styles.askButton} onPress={handleAskAssistant} disabled={loadingAnswer || !question.trim()}>
            {loadingAnswer ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.askButtonText}>Questionner l'IA</Text>}
          </Pressable>

          {assistantAnswer && (
            <View style={styles.answerBox}>
              <Text style={styles.answerTitle}>Résumé</Text>
              <Text style={styles.answerText}>{assistantAnswer.resume || 'Aucune réponse.'}</Text>

              <Text style={styles.answerTitle}>Conseils</Text>
              {(assistantAnswer.conseils || []).map((item, index) => (
                <Text key={`c-${index}`} style={styles.answerText}>• {item}</Text>
              ))}

              <Text style={styles.answerTitle}>Vigilance</Text>
              {(assistantAnswer.vigilance || []).map((item, index) => (
                <Text key={`v-${index}`} style={styles.answerText}>• {item}</Text>
              ))}

              <Text style={styles.answerTitle}>Prochaines actions</Text>
              {(assistantAnswer.prochaines_actions || []).map((item, index) => (
                <Text key={`p-${index}`} style={styles.answerText}>• {item}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f0e8' },
  header: {
    backgroundColor: '#fffdf8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d8c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1d2a1e',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7a6d',
    marginTop: 2,
  },
  varietiesContainer: {
    backgroundColor: '#fffdf8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d8c7',
  },
  infoBlock: {
    backgroundColor: '#fffdf8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d8c7',
    gap: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#446347',
  },
  infoLine: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3f4f40',
  },
  varietiesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#446347',
    marginBottom: 8,
  },
  varietiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  varietyTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21543d',
  },
  varietyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#21543d',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fffdf8',
    borderBottomWidth: 2,
    borderBottomColor: '#e0d8c7',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#c96c2d',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a9a8b',
  },
  tabLabelActive: {
    color: '#21543d',
  },
  content: { flex: 1 },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d2a1e',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#c96c2d',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d2a1e',
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#446347',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3e4e40',
  },
  assistantCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0d8c7',
    padding: 14,
    gap: 10,
    marginTop: 8,
  },
  assistantTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1d2a1e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d2c1',
    backgroundColor: '#fdfbf5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#243224',
    minHeight: 54,
    textAlignVertical: 'top',
  },
  askButton: {
    backgroundColor: '#21543d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  askButtonText: {
    color: '#fffdf8',
    fontWeight: '800',
  },
  answerBox: {
    backgroundColor: '#eef7f0',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  answerTitle: {
    fontWeight: '800',
    color: '#1f4a2e',
    marginTop: 4,
  },
  answerText: {
    color: '#2e4531',
    lineHeight: 19,
  },
});
