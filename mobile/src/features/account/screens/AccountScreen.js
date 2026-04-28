import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../../../config';

export default function AccountScreen({ user, onLogout }) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>API</Text>
          <Text style={styles.value} numberOfLines={1}>{API_BASE_URL}</Text>
        </View>
      </View>
      <Pressable style={styles.dangerButton} onPress={onLogout}>
        <Text style={styles.dangerButtonText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionTitle: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 12 },
  label: { color: '#677267', fontWeight: '600' },
  value: { color: '#1d2a1e', fontWeight: '700', maxWidth: '65%', textAlign: 'right' },
  dangerButton: { backgroundColor: '#9f2f1f', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  dangerButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 15 },
});
