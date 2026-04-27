import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { API_BASE_URL } from './src/config';
import { createDiagnostic, fetchDiagnostics, fetchParcelles, login, register } from './src/services/api';

const SESSION_KEY = 'parcellia.session';

const defaultCredentials = {
  email: 'demo@parcell-ia.com',
  password: 'demo123',
};

function StatCard({ label, value, accent }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

function RiskBadge({ value }) {
  const tone = value === 'Élevé'
    ? styles.riskHigh
    : value === 'Modéré'
      ? styles.riskMedium
      : value === 'Faible'
        ? styles.riskLow
        : styles.riskNone;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{value || 'Inconnu'}</Text>
    </View>
  );
}

function formatDate(value) {
  if (!value) return 'Date inconnue';

  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState(defaultCredentials);
  const [authMode, setAuthMode] = useState('login');
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [screen, setScreen] = useState('dashboard');
  const [parcelles, setParcelles] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [selectedParcelleId, setSelectedParcelleId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          setToken(session.token || '');
          setUser(session.user || null);
        }
      } catch {
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setBooting(false);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshData();
  }, [token]);

  async function persistSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  }

  async function clearSession() {
    setToken('');
    setUser(null);
    setParcelles([]);
    setDiagnostics([]);
    setSelectedParcelleId(null);
    setSelectedImage(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  async function handleLogin() {
    setAuthLoading(true);
    try {
      const session = await login(credentials);
      await persistSession(session.token, session.user);
    } catch (error) {
      Alert.alert('Connexion impossible', error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister() {
    const name = registerData.name.trim();
    const email = registerData.email.trim();
    const { password, confirmPassword } = registerData;

    if (!name || !email || !password) {
      Alert.alert('Champs incomplets', 'Renseigne le nom, l email et le mot de passe.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Utilise au moins 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setRegisterLoading(true);
    try {
      const session = await register({ name, email, password });
      await persistSession(session.token, session.user);
    } catch (error) {
      Alert.alert('Inscription impossible', error.message);
    } finally {
      setRegisterLoading(false);
    }
  }

  async function refreshData() {
    if (!token) return;

    setRefreshing(true);
    try {
      const [parcellesData, diagnosticsData] = await Promise.all([
        fetchParcelles(token),
        fetchDiagnostics(token),
      ]);

      setParcelles(parcellesData);
      setDiagnostics(diagnosticsData);
      setSelectedParcelleId((current) => current || parcellesData[0]?.id || null);
    } catch (error) {
      Alert.alert('Synchronisation impossible', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès refusé', 'Autorise la caméra pour photographier la plante.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0]);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès refusé', 'Autorise la photothèque pour envoyer une image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0]);
    }
  }

  async function handleCreateDiagnostic() {
    if (!selectedImage?.base64) {
      Alert.alert('Image requise', 'Choisis une photo de feuille ou de plante avant de lancer l’analyse.');
      return;
    }

    setSubmitting(true);
    try {
      await createDiagnostic(token, {
        parcelle_id: selectedParcelleId,
        image_base64: selectedImage.base64,
      });
      setSelectedImage(null);
      setScreen('dashboard');
      await refreshData();
      Alert.alert('Diagnostic créé', 'L’analyse est disponible dans la liste.');
    } catch (error) {
      Alert.alert('Analyse indisponible', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#003920" />
      </SafeAreaView>
    );
  }

  if (!token || !user) {
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
                  <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={authLoading}>
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
                  <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={registerLoading}>
                    <Text style={styles.primaryButtonText}>
                      {registerLoading ? 'Inscription...' : 'Creer mon compte'}
                    </Text>
                  </Pressable>
                </>
              )}
              <Text style={styles.helperText}>API cible: {API_BASE_URL}</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const elevatedCount = diagnostics.filter((item) => item.niveau_risque === 'Élevé').length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Bonjour {user.name}</Text>
          <Text style={styles.headerTitle}>Pilotage des parcelles</Text>
        </View>
        <Pressable style={styles.secondaryButton} onPress={clearSession}>
          <Text style={styles.secondaryButtonText}>Deconnexion</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, screen === 'dashboard' ? styles.tabButtonActive : null]}
          onPress={() => setScreen('dashboard')}
        >
          <Text style={[styles.tabText, screen === 'dashboard' ? styles.tabTextActive : null]}>Tableau de bord</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, screen === 'new' ? styles.tabButtonActive : null]}
          onPress={() => setScreen('new')}
        >
          <Text style={[styles.tabText, screen === 'new' ? styles.tabTextActive : null]}>Nouveau diagnostic</Text>
        </Pressable>
      </View>

      {screen === 'dashboard' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <StatCard label="Parcelles" value={parcelles.length} />
            <StatCard label="Diagnostics" value={diagnostics.length} />
            <StatCard label="Risque eleve" value={elevatedCount} accent="#9f2f1f" />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes parcelles</Text>
              <Pressable onPress={refreshData} disabled={refreshing}>
                <Text style={styles.inlineAction}>{refreshing ? 'Actualisation...' : 'Actualiser'}</Text>
              </Pressable>
            </View>
            {parcelles.map((parcelle) => (
              <View key={parcelle.id} style={styles.parcelleRow}>
                <View>
                  <Text style={styles.parcelleTitle}>{parcelle.name}</Text>
                  <Text style={styles.parcelleMeta}>
                    {parcelle.culture} | {parcelle.surface_ha} ha
                  </Text>
                </View>
                <Text style={styles.parcelleCoords}>
                  {Number(parcelle.latitude).toFixed(2)}, {Number(parcelle.longitude).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Derniers diagnostics</Text>
            {diagnostics.map((diagnostic) => (
              <View key={diagnostic.id} style={styles.diagnosticCard}>
                <View style={styles.diagnosticHeader}>
                  <View style={styles.diagnosticHeaderText}>
                    <Text style={styles.diagnosticTitle}>{diagnostic.maladie_detectee}</Text>
                    <Text style={styles.diagnosticMeta}>
                      {diagnostic.parcelle_name || 'Parcelle non rattachee'} | {formatDate(diagnostic.created_at)}
                    </Text>
                  </View>
                  <RiskBadge value={diagnostic.niveau_risque} />
                </View>
                <Text style={styles.diagnosticAdvice}>{diagnostic.conseil}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Associer la parcelle</Text>
            <View style={styles.selectorList}>
              {parcelles.map((parcelle) => {
                const active = selectedParcelleId === parcelle.id;
                return (
                  <Pressable
                    key={parcelle.id}
                    style={[styles.selectorPill, active ? styles.selectorPillActive : null]}
                    onPress={() => setSelectedParcelleId(parcelle.id)}
                  >
                    <Text style={[styles.selectorText, active ? styles.selectorTextActive : null]}>
                      {parcelle.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Photo a analyser</Text>
            <View style={styles.imageSourceRow}>
              <Pressable style={[styles.primaryButton, styles.imageSourceButton]} onPress={takePhoto}>
                <Text style={styles.primaryButtonText}>Prendre une photo</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.imageSourceButton]} onPress={pickImage}>
                <Text style={styles.secondaryButtonText}>Galerie</Text>
              </Pressable>
            </View>
            {selectedImage ? (
              <View style={styles.previewBlock}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <Text style={styles.helperText}>Image prete pour l analyse IA</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>Aucune image selectionnee</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Envoyer au backend</Text>
            <Text style={styles.helperText}>
              Le backend tourne sur {API_BASE_URL}. Si tu testes depuis un autre reseau, pense a ajuster l IP.
            </Text>
            <Pressable style={styles.primaryButton} onPress={handleCreateDiagnostic} disabled={submitting}>
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Analyse en cours...' : 'Lancer le diagnostic'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f0e8',
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1d2a1e',
    fontSize: 24,
    fontWeight: '800',
  },
  tabRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#e6dfd0',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#21543d',
  },
  tabText: {
    color: '#516052',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fffdf8',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fffdf8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0d8c7',
    gap: 8,
  },
  statLabel: {
    color: '#6f7b70',
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    color: '#1d2a1e',
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#e0d8c7',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#1d2a1e',
    fontSize: 18,
    fontWeight: '800',
  },
  inlineAction: {
    color: '#21543d',
    fontWeight: '700',
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
  secondaryButton: {
    backgroundColor: '#e8e1d3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: '#4d5a4d',
    fontWeight: '700',
  },
  helperText: {
    color: '#6c776d',
    fontSize: 13,
    lineHeight: 19,
  },
  parcelleRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee7d8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  parcelleTitle: {
    color: '#213123',
    fontSize: 16,
    fontWeight: '700',
  },
  parcelleMeta: {
    color: '#677267',
    marginTop: 4,
  },
  parcelleCoords: {
    color: '#7a847b',
    fontSize: 12,
    maxWidth: 110,
    textAlign: 'right',
  },
  diagnosticCard: {
    borderTopWidth: 1,
    borderTopColor: '#eee7d8',
    paddingTop: 14,
    gap: 10,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  diagnosticHeaderText: {
    flex: 1,
    gap: 4,
  },
  diagnosticTitle: {
    color: '#1d2a1e',
    fontSize: 16,
    fontWeight: '700',
  },
  diagnosticMeta: {
    color: '#677267',
    fontSize: 12,
  },
  diagnosticAdvice: {
    color: '#374238',
    lineHeight: 21,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fffdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  riskHigh: {
    backgroundColor: '#9f2f1f',
  },
  riskMedium: {
    backgroundColor: '#cf8e2a',
  },
  riskLow: {
    backgroundColor: '#53815a',
  },
  riskNone: {
    backgroundColor: '#7d8c85',
  },
  selectorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectorPill: {
    backgroundColor: '#ece3d5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectorPillActive: {
    backgroundColor: '#21543d',
  },
  selectorText: {
    color: '#506052',
    fontWeight: '700',
  },
  selectorTextActive: {
    color: '#fffdf8',
  },
  imageSourceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageSourceButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
  },
  previewBlock: {
    gap: 10,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    backgroundColor: '#ddd4c2',
  },
});
