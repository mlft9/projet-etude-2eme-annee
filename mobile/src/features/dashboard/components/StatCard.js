import { StyleSheet, Text, View, Pressable } from 'react-native';

export default function StatCard({ label, value, accent, onPress, isActive }) {
  const CardContainer = onPress ? Pressable : View;
  return (
    <CardContainer style={[styles.card, isActive && styles.cardActive]} onPress={onPress}>
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
      <Text style={[styles.value, accent ? { color: accent } : null, isActive && styles.valueActive]}>{value}</Text>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fffdf8', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e0d8c7', gap: 8 },
  cardActive: { backgroundColor: '#21543d', borderColor: '#21543d' },
  label: { color: '#6f7b70', fontSize: 15, fontWeight: '600' },
  labelActive: { color: '#e8e1d3' },
  value: { color: '#1d2a1e', fontSize: 26, fontWeight: '800' },
  valueActive: { color: '#fffaf5' },
});
