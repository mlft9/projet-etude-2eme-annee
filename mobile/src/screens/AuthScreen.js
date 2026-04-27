import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen({
  authMode,
  setAuthMode,
  credentials,
  setCredentials,
  registerData,
  setRegisterData,
  authLoading,
  registerLoading,
  onLogin,
  onRegister,
  apiBaseUrl,
}) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.authShell}>
          <View style={styles.heroPanel}>
            <Text style={styles.eyebrow}>Parcell-IA</Text>
            <Text style={styles.heroTitle}>Diagnostic agricole mobile</Text>
            <Text style={styles.heroText}>
              Connexion de demo pre-remplie pour piloter les parcelles, consulter les analyses
              et envoyer une nouvelle image.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.authTabs}>
              <Pressable
                style={[styles.authTab, authMode === 'login' ? styles.authTabActive : null]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={[styles.authTabText, authMode === 'login' ? styles.authTabTextActive : null]}>
                  Connexion
                </Text>
              </Pressable>
              <Pressable
                style={[styles.authTab, authMode === 'register' ? styles.authTabActive : null]}
                onPress={() => setAuthMode('register')}
              >
                <Text style={[styles.authTabText, authMode === 'register' ? styles.authTabTextActive : null]}>
                  Inscription
                </Text>
              </Pressable>
            </View>

            {authMode === 'login' ? (
              <>
                <Text style={styles.sectionTitle}>Connexion</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor="#7b887d"
                  style={styles.input}
                  value={credentials.email}
                  onChangeText={(email) => setCredentials((current) => ({ ...current, email }))}
                />
                <TextInput
                  placeholder="Mot de passe"
                  placeholderTextColor="#7b887d"
                  secureTextEntry
                  style={styles.input}
                  value={credentials.password}
                  onChangeText={(password) => setCredentials((current) => ({ ...current, password }))}
                />
                <Pressable style={styles.primaryButton} onPress={onLogin} disabled={authLoading}>
                  <Text style={styles.primaryButtonText}>
                    {authLoading ? 'Connexion...' : 'Entrer dans l application'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Inscription</Text>
                <TextInput
                  placeholder="Nom complet"
                  placeholderTextColor="#7b887d"
                  style={styles.input}
                  value={registerData.name}
                  onChangeText={(name) => setRegisterData((current) => ({ ...current, name }))}
                />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor="#7b887d"
                  style={styles.input}
                  value={registerData.email}
                  onChangeText={(email) => setRegisterData((current) => ({ ...current, email }))}
                />
                <TextInput
                  placeholder="Mot de passe"
                  placeholderTextColor="#7b887d"
                  secureTextEntry
                  style={styles.input}
                  value={registerData.password}
                  onChangeText={(password) => setRegisterData((current) => ({ ...current, password }))}
                />
                <TextInput
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#7b887d"
                  secureTextEntry
                  style={styles.input}
                  value={registerData.confirmPassword}
                  onChangeText={(confirmPassword) =>
                    setRegisterData((current) => ({ ...current, confirmPassword }))
                  }
                />
                <Pressable style={styles.primaryButton} onPress={onRegister} disabled={registerLoading}>
                  <Text style={styles.primaryButtonText}>
                    {registerLoading ? 'Inscription...' : 'Creer mon compte'}
                  </Text>
                </Pressable>
              </>
            )}
            <Text style={styles.helperText}>API cible: {apiBaseUrl}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f0e8',
  },
  flex: {
    flex: 1,
  },
  authShell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 18,
    backgroundColor: '#f3f0e8',
  },
  heroPanel: {
    backgroundColor: '#21543d',
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    color: '#d4e4c6',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: '#fffdf8',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroText: {
    color: '#dce7dd',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#e0d8c7',
  },
  sectionTitle: {
    color: '#1d2a1e',
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#f6f2e8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1d2a1e',
    borderWidth: 1,
    borderColor: '#ddd4c2',
  },
  primaryButton: {
    backgroundColor: '#c96c2d',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fffaf5',
    fontWeight: '800',
    fontSize: 15,
  },
  helperText: {
    color: '#6c776d',
    fontSize: 13,
    lineHeight: 19,
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3ead8',
    borderRadius: 16,
    padding: 4,
    gap: 6,
  },
  authTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  authTabActive: {
    backgroundColor: '#21543d',
  },
  authTabText: {
    color: '#6d7a6e',
    fontWeight: '700',
  },
  authTabTextActive: {
    color: '#fffdf8',
  },
});
