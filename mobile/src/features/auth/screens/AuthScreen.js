import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../../../config';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const defaultCredentials = { email: 'demo@parcell-ia.com', password: 'demo123' };
const defaultRegisterData = { name: '', email: '', password: '', confirmPassword: '' };

export default function AuthScreen({ authLoading, registerLoading, onLogin, onRegister }) {
  const [authMode, setAuthMode] = useState('login');
  const [credentials, setCredentials] = useState(defaultCredentials);
  const [registerData, setRegisterData] = useState(defaultRegisterData);

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
            <View style={styles.authTabs}>
              {['login', 'register'].map((mode) => (
                <Pressable
                  key={mode}
                  style={[styles.authTab, authMode === mode ? styles.authTabActive : null]}
                  onPress={() => setAuthMode(mode)}
                >
                  <Text style={[styles.authTabText, authMode === mode ? styles.authTabTextActive : null]}>
                    {mode === 'login' ? 'Connexion' : 'Inscription'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {authMode === 'login' ? (
              <LoginForm
                credentials={credentials}
                setCredentials={setCredentials}
                loading={authLoading}
                onSubmit={() => onLogin(credentials)}
              />
            ) : (
              <RegisterForm
                data={registerData}
                setData={setRegisterData}
                loading={registerLoading}
                onSubmit={() => onRegister(registerData)}
              />
            )}

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
  authTabs: { flexDirection: 'row', backgroundColor: '#f3ead8', borderRadius: 16, padding: 4, gap: 6 },
  authTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14 },
  authTabActive: { backgroundColor: '#21543d' },
  authTabText: { color: '#6d7a6e', fontWeight: '700' },
  authTabTextActive: { color: '#fffdf8' },
  helperText: { color: '#6c776d', fontSize: 13, lineHeight: 19 },
});
