import { StyleSheet, Text, View } from 'react-native';

export default function CultureBadge({ culture }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{culture || 'Culture inconnue'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#d6ecda', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  text: { color: '#1d5c2e', fontSize: 12, fontWeight: '700' },
});
