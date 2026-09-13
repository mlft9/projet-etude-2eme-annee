import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS_DATA, ANIMALS_DATA } from '../../../shared/data/plantsData';

export default function PlantLibraryScreen({ selectedPlant, onBack, onOpenPlantDetails, onOpenCatalog }) {
  const [activeTab, setActiveTab] = useState('cultures'); // 'cultures' ou 'elevage'

  const catalog = activeTab === 'cultures' ? Object.values(PLANTS_DATA) : Object.values(ANIMALS_DATA);
  const normalizedSelected = String(selectedPlant || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const selectedPlantData = catalog.find((item) => {
    const normalizedName = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return normalizedName === normalizedSelected;
  });
  const displayItems = selectedPlantData ? [selectedPlantData] : catalog;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#21543d" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bibliothèque Agricole</Text>
            <Text style={styles.subtitle}>Catalogue des cultures, animaux, maladies et besoins</Text>
          </View>
        </View>

        {!selectedPlant && (
          <View style={styles.tabsRow}>
            <Pressable style={[styles.tab, activeTab === 'cultures' && styles.tabActive]} onPress={() => setActiveTab('cultures')}>
              <Text style={[styles.tabText, activeTab === 'cultures' && styles.tabTextActive]}>🌱 Cultures</Text>
            </Pressable>
            <Pressable style={[styles.tab, activeTab === 'elevage' && styles.tabActive]} onPress={() => setActiveTab('elevage')}>
              <Text style={[styles.tabText, activeTab === 'elevage' && styles.tabTextActive]}>🐄 Élevage</Text>
            </Pressable>
          </View>
        )}

        {selectedPlant ? (
          <View style={styles.focusBox}>
            <Text style={styles.focusText}>Plante detectee dans votre parcelle: {selectedPlant}</Text>
            <Pressable style={styles.focusButton} onPress={() => onOpenPlantDetails(selectedPlant)}>
              <Text style={styles.focusButtonText}>Ouvrir la fiche IA</Text>
            </Pressable>
            <Pressable style={styles.catalogToggleButton} onPress={onOpenCatalog}>
              <Text style={styles.catalogToggleText}>Voir tout le catalogue</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {displayItems.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.varietiesCount}>{item.varieties.length} variétés/races</Text>
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.varietiesRow}>
            {item.varieties.map((v) => (
              <View key={v} style={styles.varietyPill}>
                <Text style={styles.varietyPillText}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>Maladies: {item.diseases.length}</Text>
            <Text style={styles.metaItem}>{activeTab === 'cultures' ? 'Nuisibles' : 'Parasites'}: {item.pests?.length || 0}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => onOpenPlantDetails(item.name)}>
              <Text style={styles.secondaryButtonText}>Voir détails</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => onOpenPlantDetails(item.name)}>
              <Text style={styles.primaryButtonText}>Questionner IA</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  headerCard: { backgroundColor: '#fffdf8', borderRadius: 18, borderWidth: 1, borderColor: '#e0d8c7', padding: 14, gap: 10 },
  headerRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#1d2a1e' },
  subtitle: { fontSize: 13, color: '#5f6f60' },
  focusBox: { marginTop: 8, backgroundColor: '#eef7f0', borderRadius: 12, borderWidth: 1, borderColor: '#bdd9c1', padding: 10, gap: 8 },
  focusText: { color: '#1f4a2e', fontWeight: '700' },
  focusButton: { alignSelf: 'flex-start', backgroundColor: '#21543d', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  focusButtonText: { color: '#fffdf8', fontWeight: '700' },
  catalogToggleButton: { alignSelf: 'flex-start', backgroundColor: '#ece3d5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  catalogToggleText: { color: '#415240', fontWeight: '700' },
  card: { backgroundColor: '#fffdf8', borderRadius: 18, borderWidth: 1, borderColor: '#e0d8c7', padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1d2a1e' },
  varietiesCount: { color: '#617262', fontWeight: '700' },
  description: { color: '#3f4f40', lineHeight: 20 },
  varietiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  varietyPill: { backgroundColor: '#eef7f0', borderWidth: 1, borderColor: '#bdd9c1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  varietyPillText: { color: '#1f4a2e', fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaItem: { color: '#4f614f', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, backgroundColor: '#ece3d5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#4d5a4d', fontWeight: '800' },
  primaryButton: { flex: 1, backgroundColor: '#21543d', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fffdf8', fontWeight: '800' },
  tabsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f0ebd8', borderRadius: 10 },
  tabActive: { backgroundColor: '#21543d' },
  tabText: { color: '#677267', fontWeight: '700', fontSize: 15 },
  tabTextActive: { color: '#fffdf8' },
});
