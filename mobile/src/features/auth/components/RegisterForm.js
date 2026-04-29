import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

export default function RegisterForm({ data, setData, loading, onSubmit }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Inscription</Text>
      <TextInput
        placeholder="Nom complet"
        placeholderTextColor="#7b887d"
        style={styles.input}
        value={data.name}
        onChangeText={(name) => setData((d) => ({ ...d, name }))}
      />
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#7b887d"
        style={styles.input}
        value={data.email}
        onChangeText={(email) => setData((d) => ({ ...d, email }))}
      />
      <TextInput
        placeholder="Mot de passe"
        placeholderTextColor="#7b887d"
        secureTextEntry
        style={styles.input}
        value={data.password}
        onChangeText={(password) => setData((d) => ({ ...d, password }))}
      />
      <TextInput
        placeholder="Confirmer le mot de passe"
        placeholderTextColor="#7b887d"
        secureTextEntry
        style={styles.input}
        value={data.confirmPassword}
        onChangeText={(confirmPassword) => setData((d) => ({ ...d, confirmPassword }))}
      />
      <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
        <Text style={styles.primaryButtonText}>
          {loading ? 'Inscription...' : 'Creer mon compte'}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  input: {
    backgroundColor: '#f6f2e8',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1d2a1e',
    borderWidth: 1,
    borderColor: '#ddd4c2',
  },
  primaryButton: { backgroundColor: '#c96c2d', borderRadius: 16, paddingVertical: 22, alignItems: 'center' },
  primaryButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 17 },
});
