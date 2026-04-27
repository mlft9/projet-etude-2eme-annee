import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function CultureBadge({ culture }) {
  return (
    <View style={styles.cultureBadge}>
      <Text style={styles.cultureBadgeText}>{culture || 'Culture inconnue'}</Text>
    </View>
  );
}

export default function MapScreen({ parcelles, refreshing, onRefresh }) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parcelles</Text>
        <Pressable onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.action}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
        </Pressable>
      </View>

      {parcelles.length === 0 && (
        <Text style={styles.empty}>Aucune parcelle enregistree.</Text>
      )}

      {parcelles.map((parcelle) => {
        const lat = Number(parcelle.latitude);
        const lng = Number(parcelle.longitude);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

        return (
          <View key={parcelle.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{parcelle.name}</Text>
              <CultureBadge culture={parcelle.culture} />
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Surface</Text>
              <Text style={styles.cardValue}>{parcelle.surface_ha} ha</Text>
            </View>
            {hasCoords && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Coordonnees</Text>
                <Text style={styles.cardValue}>{lat.toFixed(4)}, {lng.toFixed(4)}</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#1d2a1e',
    fontSize: 18,
    fontWeight: '800',
  },
  action: {
    color: '#21543d',
    fontWeight: '700',
  },
  empty: {
    color: '#6c776d',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0d8c7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#1d2a1e',
    fontSize: 16,
    fontWeight: '800',
  },
  cultureBadge: {
    backgroundColor: '#d6ecda',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cultureBadgeText: {
    color: '#1d5c2e',
    fontSize: 12,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee7d8',
    paddingTop: 8,
  },
  cardLabel: {
    color: '#677267',
    fontWeight: '600',
  },
  cardValue: {
    color: '#1d2a1e',
    fontWeight: '700',
  },
});
