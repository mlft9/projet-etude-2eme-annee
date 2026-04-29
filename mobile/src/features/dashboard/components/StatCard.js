import { StyleSheet, Text, View } from 'react-native';

export default function StatCard({ label, value, accent }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fffdf8', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e0d8c7', gap: 8 },
  label: { color: '#6f7b70', fontSize: 15, fontWeight: '600' },
  value: { color: '#1d2a1e', fontSize: 26, fontWeight: '800' },
});
