import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from './src/features/auth/hooks/useAuth';
import AuthScreen from './src/features/auth/screens/AuthScreen';
import DashboardScreen from './src/features/dashboard/screens/DashboardScreen';
import DiagnosticsScreen from './src/features/diagnostics/screens/DiagnosticsScreen';
import NewDiagnosticScreen from './src/features/diagnostics/screens/NewDiagnosticScreen';
import RefinementScreen from './src/features/diagnostics/screens/RefinementScreen';
import DiagnosticResultScreen from './src/features/diagnostics/screens/DiagnosticResultScreen';
import MapScreen from './src/features/parcelles/screens/MapScreen';
import AccountScreen from './src/features/account/screens/AccountScreen';
import PlantLibraryScreen from './src/features/plants/screens/PlantLibraryScreen';
import PlantDetailsScreen from './src/features/plants/screens/PlantDetailsScreen';
import DiagnosticDetailScreen from './src/features/diagnostics/screens/DiagnosticDetailScreen';

import * as ImagePicker from 'expo-image-picker';
import { fetchParcelles, fetchDiagnostics, createDiagnostic, refineDiagnostic, fetchLatestCapteurs } from './src/shared/services/api';

export default function App() {
  const insets = useSafeAreaInsets();
  const { booting, token, user, authLoading, handleLogin, clearSession } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [screen, setScreen] = useState('dashboard');
  const [parcelles, setParcelles] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [selectedParcelleId, setSelectedParcelleId] = useState(null);
  const [pendingRefinement, setPendingRefinement] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [fabImage, setFabImage] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [plantBackScreen, setPlantBackScreen] = useState('dashboard');
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null);

  useEffect(() => {
    if (token) refreshData();
  }, [token]);

  async function refreshData() {
    if (!token) return;
    setRefreshing(true);
    try {
      const [p, d] = await Promise.all([fetchParcelles(token), fetchDiagnostics(token)]);
      setParcelles(p);
      setDiagnostics(d);
      setSelectedParcelleId((curr) => curr || p[0]?.id || null);
    } catch (error) {
      Alert.alert('Synchronisation impossible', error.message);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }

  async function handleLogout() {
    setScreen('dashboard');
    setInitialLoading(true);
    setParcelles([]);
    setDiagnostics([]);
    setPendingRefinement(null);
    setDiagnosticResult(null);
    await clearSession();
  }

  async function handleLogin_(credentials) {
    try {
      await handleLogin(credentials);
    } catch (error) {
      Alert.alert('Connexion impossible', error.message);
    }
  }

  const CONFIDENCE_THRESHOLD = 60;

  async function handleCreateDiagnostic(payload) {
    setSubmitting(true);
    try {
      const diagnostic = await createDiagnostic(token, payload);

      if (diagnostic.score_confiance != null && diagnostic.score_confiance < CONFIDENCE_THRESHOLD && diagnostic.parcelle_id) {
        let initialCapteurs = null;
        try {
          initialCapteurs = await fetchLatestCapteurs(token, diagnostic.parcelle_id);
        } catch (_) {}
        setPendingRefinement({ diagnostic, initialCapteurs });
        setScreen('refine');
      } else {
        setDiagnosticResult(diagnostic);
        setScreen('result');
        refreshData();
      }
    } catch (error) {
      Alert.alert('Analyse indisponible', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefineDiagnostic(capteurData) {
    if (!pendingRefinement) return;
    setSubmitting(true);
    try {
      const refined = await refineDiagnostic(token, pendingRefinement.diagnostic.id, capteurData);
      setPendingRefinement(null);
      setDiagnosticResult(refined ?? pendingRefinement.diagnostic);
      setScreen('result');
      refreshData();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function openCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Accès refusé', 'Autorise la caméra dans les réglages.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7, base64: true });
    setFabImage(!result.canceled && result.assets?.[0] ? result.assets[0] : null);
    setScreen('new');
  }

  async function openGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Accès refusé', 'Autorise la photothèque dans les réglages.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7, base64: true });
    setFabImage(!result.canceled && result.assets?.[0] ? result.assets[0] : null);
    setScreen('new');
  }

  function handleFabPress() {
    Alert.alert('Nouvelle photo', null, [
      { text: 'Prendre une photo', onPress: openCamera },
      { text: 'Choisir dans la galerie', onPress: openGallery },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  function handleSkipRefinement() {
    const diag = pendingRefinement?.diagnostic;
    setPendingRefinement(null);
    setDiagnosticResult(diag ?? null);
    setScreen(diag ? 'result' : 'dashboard');
    refreshData();
  }

  function openPlantLibrary(plantName = null, fromScreen = 'dashboard') {
    setSelectedPlant(plantName || null);
    setPlantBackScreen(fromScreen);
    setScreen('plant-library');
  }

  function openPlantDetails(plantName, fromScreen = 'plant-library') {
    setSelectedPlant(plantName);
    setPlantBackScreen(fromScreen);
    setScreen('plant-details');
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
      <AuthScreen
        authLoading={authLoading}
        onLogin={handleLogin_}
      />
    );
  }

  function renderScreen() {
    switch (screen) {
      case 'dashboard':
        return <DashboardScreen user={user} parcelles={parcelles} diagnostics={diagnostics} refreshing={refreshing} onRefresh={refreshData} onViewAllDiagnostics={() => setScreen('diagnostics')} />;
      case 'map':
        return <ScrollView contentContainerStyle={styles.mapWrapper}><MapScreen parcelles={parcelles} refreshing={refreshing} onRefresh={refreshData} token={token} /></ScrollView>;
      case 'diagnostics':
        return <DiagnosticsScreen diagnostics={diagnostics} parcelles={parcelles} selectedParcelleId={selectedParcelleId} onSelectParcelle={setSelectedParcelleId} refreshing={refreshing} onRefresh={refreshData} onOpenPlantLibrary={() => openPlantLibrary(null, 'diagnostics')} onViewPlant={(plant) => openPlantLibrary(plant, 'diagnostics')} onOpenDiagnostic={(d) => { setSelectedDiagnostic(d); setScreen('diagnostic-detail'); }} />;
      case 'new':
        return <NewDiagnosticScreen parcelles={parcelles} selectedParcelleId={selectedParcelleId} onSelectParcelle={setSelectedParcelleId} onSubmit={handleCreateDiagnostic} submitting={submitting} initialImage={fabImage} />;
      case 'refine':
        return <RefinementScreen diagnostic={pendingRefinement?.diagnostic} initialCapteurs={pendingRefinement?.initialCapteurs} submitting={submitting} onRefine={handleRefineDiagnostic} onSkip={handleSkipRefinement} />;
      case 'plant-library':
        return <PlantLibraryScreen selectedPlant={selectedPlant} onBack={() => setScreen(plantBackScreen)} onOpenCatalog={() => setSelectedPlant(null)} onOpenPlantDetails={(plant) => openPlantDetails(plant, 'plant-library')} />;
      case 'plant-details':
        return <PlantDetailsScreen plant={selectedPlant} token={token} onBack={() => setScreen(plantBackScreen)} />;
      case 'diagnostic-detail':
        return <DiagnosticDetailScreen diagnostic={selectedDiagnostic} token={token} onBack={() => setScreen('diagnostics')} />;
      case 'result':
        return <DiagnosticResultScreen diagnostic={diagnosticResult} onViewAll={() => { setDiagnosticResult(null); setScreen('diagnostics'); }} onGoHome={() => { setDiagnosticResult(null); setScreen('dashboard'); }} />;
      case 'account':
        return <AccountScreen user={user} token={token} onLogout={handleLogout} />;
      default:
        return null;
    }
  }

  const tabs = [
    { key: 'dashboard', icon: 'home', label: 'Accueil' },
    { key: 'map', icon: 'map', label: 'Parcelles' },
    { key: 'new', icon: null, label: null },
    { key: 'diagnostics', icon: 'leaf', label: 'Diagnostics' },
    { key: 'account', icon: 'person', label: 'Compte' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeContent} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Bonjour {user.name}</Text>
            <Text style={styles.headerTitle}>Pilotage des parcelles</Text>
          </View>
        </View>
        {renderScreen()}
      </SafeAreaView>

      {initialLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#21543d" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        </View>
      )}

      {refreshing && !initialLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#21543d" />
            <Text style={styles.loadingText}>Mise à jour...</Text>
          </View>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 4 }]}>
        {tabs.map((tab) =>
          tab.icon === null ? (
            <Pressable key={tab.key} style={styles.fabButton} onPress={handleFabPress}>
              <Ionicons name="add" size={32} color="#fffdf8" />
            </Pressable>
          ) : (
            <Pressable key={tab.key} style={styles.tabItem} onPress={() => setScreen(tab.key)}>
              <Ionicons name={tab.icon} size={24} color={screen === tab.key ? '#21543d' : '#8a9a8b'} />
              <Text style={[styles.tabLabel, screen === tab.key ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f0e8' },
  safeContent: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f0e8' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#446347', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  headerTitle: { color: '#1d2a1e', fontSize: 24, fontWeight: '800' },
  mapWrapper: { flexGrow: 1 },
  bottomBar: { flexDirection: 'row', backgroundColor: '#fffdf8', borderTopWidth: 1, borderTopColor: '#e0d8c7', paddingTop: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'space-between' },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#8a9a8b' },
  tabLabelActive: { color: '#21543d' },
  fabButton: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#21543d', alignItems: 'center', justifyContent: 'center', marginBottom: 18, elevation: 8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(243, 240, 232, 0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingBox: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 32, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#e0d8c7', elevation: 4 },
  loadingText: { color: '#1d2a1e', fontSize: 15, fontWeight: '700' },
});
