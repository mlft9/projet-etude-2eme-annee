import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLANTS_DATA } from '../../../shared/data/plantsData';

export default function PlantLibraryScreen({ selectedPlant, onBack, onOpenPlantDetails, onOpenCatalog }) {
  const catalog = Object.values(PLANTS_DATA);
  const normalizedSelected = String(selectedPlant || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const selectedPlantData = catalog.find((plant) => {
    const normalizedName = plant.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return normalizedName === normalizedSelected;
  });
  const displayPlants = selectedPlantData ? [selectedPlantData] : catalog;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#21543d" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bibliotheque des plantes</Text>
            <Text style={styles.subtitle}>Catalogue des cultures, maladies, besoins et nuisibles</Text>
          </View>
        </View>

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

      {displayPlants.map((plant) => (
        <View key={plant.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{plant.name}</Text>
            <Text style={styles.varietiesCount}>{plant.varieties.length} varietes</Text>
          </View>

          <Text style={styles.description}>{plant.description}</Text>

          <View style={styles.varietiesRow}>
            {plant.varieties.map((v) => (
              <View key={v} style={styles.varietyPill}>
                <Text style={styles.varietyPillText}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>Maladies: {plant.diseases.length}</Text>
            <Text style={styles.metaItem}>Nuisibles: {plant.pests.length}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => onOpenPlantDetails(plant.name)}>
              <Text style={styles.secondaryButtonText}>Voir details</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => onOpenPlantDetails(plant.name)}>
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
  secondaryButtonText: { color: '#435241', fontWeight: '700' },
  primaryButton: { flex: 1, backgroundColor: '#c96c2d', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fffdf8', fontWeight: '800' },
});
