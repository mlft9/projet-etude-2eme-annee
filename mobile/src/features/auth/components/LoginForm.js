import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

export default function LoginForm({ credentials, setCredentials, loading, onSubmit }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Connexion</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#7b887d"
        style={styles.input}
        value={credentials.email}
        onChangeText={(email) => setCredentials((c) => ({ ...c, email }))}
      />
      <TextInput
        placeholder="Mot de passe"
        placeholderTextColor="#7b887d"
        secureTextEntry
        style={styles.input}
        value={credentials.password}
        onChangeText={(password) => setCredentials((c) => ({ ...c, password }))}
      />
      <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
        <Text style={styles.primaryButtonText}>
          {loading ? 'Connexion...' : 'Entrer dans l application'}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  input: {
    backgroundColor: '#f6f2e8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1d2a1e',
    borderWidth: 1,
    borderColor: '#ddd4c2',
  },
  primaryButton: { backgroundColor: '#c96c2d', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 15 },
});
