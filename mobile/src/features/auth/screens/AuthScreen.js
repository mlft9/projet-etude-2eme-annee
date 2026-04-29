import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../../../config';
import LoginForm from '../components/LoginForm';

const defaultCredentials = { email: 'demo@parcell-ia.com', password: 'demo123' };

export default function AuthScreen({ authLoading, onLogin }) {
  const [credentials, setCredentials] = useState(defaultCredentials);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.authShell}>
          <View style={styles.heroPanel}>
            <Text style={styles.eyebrow}>Parcell-IA</Text>
            <Text style={styles.heroTitle}>Diagnostic agricole mobile</Text>
            <Text style={styles.heroText}>
              Connexion de demo pre-remplie pour piloter les parcelles, consulter les analyses et envoyer une nouvelle image.
            </Text>
          </View>

          <View style={styles.card}>
            <LoginForm
              credentials={credentials}
              setCredentials={setCredentials}
              loading={authLoading}
              onSubmit={() => onLogin(credentials)}
            />

            <Text style={styles.helperText}>API cible: {API_BASE_URL}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f0e8' },
  flex: { flex: 1 },
  authShell: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, gap: 18, backgroundColor: '#f3f0e8' },
  heroPanel: { backgroundColor: '#21543d', borderRadius: 24, padding: 24, gap: 12 },
  eyebrow: { color: '#d4e4c6', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  heroTitle: { color: '#fffdf8', fontSize: 30, lineHeight: 34, fontWeight: '800' },
  heroText: { color: '#dce7dd', fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  helperText: { color: '#6c776d', fontSize: 13, lineHeight: 19 },
});
