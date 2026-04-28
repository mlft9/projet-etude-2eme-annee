import { StyleSheet, Text, View } from 'react-native';

export default function RiskBadge({ value }) {
  const tone =
    value === 'Élevé' ? styles.riskHigh
    : value === 'Modéré' ? styles.riskMedium
    : value === 'Faible' ? styles.riskLow
    : styles.riskNone;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{value || 'Inconnu'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { color: '#fffdf8', fontSize: 12, fontWeight: '800' },
  riskHigh: { backgroundColor: '#9f2f1f' },
  riskMedium: { backgroundColor: '#cf8e2a' },
  riskLow: { backgroundColor: '#53815a' },
  riskNone: { backgroundColor: '#7d8c85' },
});
