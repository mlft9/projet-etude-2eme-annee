import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_BASE_URL } from '../../../config';
import { fetchCapteurs, createCapteur, deleteCapteur } from '../../../shared/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen({ user, token, parcelles = [], betail = [], onLogout, onOpenGestion, onOpenPacGenerator, onOpenIAChat }) {
  const [capteurs, setCapteurs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [saving, setSaving] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryType, setGalleryType] = useState(null); // 'terrains' | 'betail'

  // Barre de navigation (Tabs)
  const [activeTab, setActiveTab] = useState('profil'); // 'profil', 'gestion', 'admin', 'capteurs'
  
  // Champs modifiables localement
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [farmName, setFarmName] = useState('Mon Exploitation');

  useEffect(() => {
    loadCapteurs();
  }, []);

  async function loadCapteurs() {
    try {
      const data = await fetchCapteurs(token);
      setCapteurs(data);
    } catch {}
  }

  async function handleCreate() {
    if (!formName.trim()) { Alert.alert('Nom requis', 'Donne un nom au capteur.'); return; }
    setSaving(true);
    try {
      await createCapteur(token, { name: formName.trim(), serial_number: formSerial.trim() || null });
      setModalOpen(false);
      setFormName('');
      setFormSerial('');
      await loadCapteurs();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(capteur) {
    Alert.alert(
      'Supprimer le capteur',
      `Supprimer "${capteur.name}" ? Il sera dissocié de toutes les parcelles.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCapteur(token, capteur.id);
              await loadCapteurs();
            } catch (err) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  }

  const tabs = [
    { id: 'profil', label: 'Profil' },
    { id: 'gestion', label: 'Gestion' },
    { id: 'admin', label: 'Administratif' },
    { id: 'capteurs', label: 'Capteurs' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profil':
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mon compte</Text>
            <Text style={styles.sectionSubtitle}>Gestion de vos informations personnelles.</Text>
            <View style={{ marginTop: 14, gap: 12 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput style={styles.input} value={userName} onChangeText={setUserName} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={userEmail} onChangeText={setUserEmail} keyboardType="email-address" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de l'exploitation</Text>
                <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Serveur API</Text>
                <Text style={[styles.input, { color: '#8a9a8b', backgroundColor: '#f5f5f5' }]}>{API_BASE_URL}</Text>
              </View>
            </View>
            <Pressable style={[styles.dangerButton, { marginTop: 20 }]} onPress={onLogout}>
              <Text style={styles.dangerButtonText}>Déconnexion</Text>
            </Pressable>
          </View>
        );
      
      case 'gestion':
        return (
          <Pressable style={styles.card} onPress={onOpenGestion}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Gestion financière & PAC</Text>
                <Text style={styles.sectionSubtitle}>Suivi de vos dépenses et revenus agricoles.</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#21543d" />
            </View>
          </Pressable>
        );

      case 'admin':
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Administratif</Text>
            <Text style={styles.sectionSubtitle}>Centralisation de vos démarches et échéances.</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
              <Pressable style={[styles.actionBtn, { flex: 1 }]} onPress={onOpenPacGenerator}>
                <Text style={styles.actionBtnText}>Générer PAC</Text>
              </Pressable>
              
              <Pressable style={[styles.actionBtn, { flex: 1, backgroundColor: '#d4af37' }]} onPress={onOpenIAChat}>
                <Ionicons name="sparkles" size={14} color="#1d2a1e" style={{ marginRight: 4 }} />
                <Text style={[styles.actionBtnText, { color: '#1d2a1e' }]}>Aide IA</Text>
              </Pressable>
            </View>

            <View style={styles.safesContainer}>
              <Pressable style={styles.safeCard} onPress={() => { setGalleryType('terrains'); setGalleryModalOpen(true); }}>
                <Ionicons name="document-text" size={24} color="#21543d" />
                <Text style={styles.safeTitle}>Coffre-Fort Terrains</Text>
                <Text style={styles.safeSub}>Baux, PAC, analyses...</Text>
                <Pressable style={styles.safeBtn} onPress={() => Alert.alert('Simulation', 'Ouverture du sélecteur de fichiers...')}>
                  <Text style={styles.safeBtnText}>+ Ajouter doc</Text>
                </Pressable>
              </Pressable>
              <Pressable style={styles.safeCard} onPress={() => { setGalleryType('betail'); setGalleryModalOpen(true); }}>
                <Ionicons name="paw" size={24} color="#21543d" />
                <Text style={styles.safeTitle}>Coffre-Fort Bétail</Text>
                <Text style={styles.safeSub}>Passeports, carnets véto...</Text>
                <Pressable style={styles.safeBtn} onPress={() => Alert.alert('Simulation', 'Ouverture du sélecteur de fichiers...')}>
                  <Text style={styles.safeBtnText}>+ Ajouter doc</Text>
                </Pressable>
              </Pressable>
            </View>

            <Text style={{ color: '#1d2a1e', fontWeight: 'bold', marginBottom: 8, marginTop: 16 }}>Échéances réglementaires (Max 3)</Text>
            <View style={{ gap: 8 }}>
              {/* Limit to 3 items if this was dynamic */}
              <View style={styles.deadlineRow}>
                <View style={styles.deadlineDateBadge}><Text style={styles.deadlineDateText}>15 Mai</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deadlineTitle}>Clôture PAC</Text>
                  <Text style={styles.deadlineSub}>Date limite sans pénalité</Text>
                </View>
              </View>
              <View style={styles.deadlineRow}>
                <View style={styles.deadlineDateBadge}><Text style={styles.deadlineDateText}>1 Sept</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deadlineTitle}>Renouvellement Assurance</Text>
                  <Text style={styles.deadlineSub}>Contrat climatique</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'capteurs':
        return (
          <View style={{ gap: 16 }}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Sondes Terrains</Text>
              <Text style={styles.sectionSubtitle}>Sondes météo et humidité regroupées par parcelle.</Text>

              <Pressable style={[styles.actionBtn, { alignSelf: 'flex-start', marginVertical: 14 }]} onPress={() => { setFormName(''); setFormSerial(''); setModalOpen(true); }}>
                <Text style={styles.actionBtnText}>+ Ajouter une sonde</Text>
              </Pressable>
            
            {parcelles.length === 0 && (
               <Text style={styles.empty}>Aucune parcelle enregistrée.</Text>
            )}

            <View style={{ gap: 16 }}>
              {parcelles.map(parcelle => {
                const parcelleCapteurs = capteurs.filter(c => c.parcelle_id === parcelle.id || Math.random() > 0.8); // Random assignment for mock if not set
                if (parcelleCapteurs.length === 0) return null;
                
                return (
                  <View key={parcelle.id}>
                    <Text style={{ fontWeight: 'bold', color: '#21543d', marginBottom: 8 }}>📍 {parcelle.name}</Text>
                    {parcelleCapteurs.map((c) => {
                      const isOnline = c.latest !== undefined || Math.random() > 0.3;
                      return (
                        <View key={c.id} style={styles.capteurRow}>
                          <View style={styles.capteurInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.capteurName}>{c.name}</Text>
                              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#53815a' : '#9f2f1f' }]} />
                              <Text style={{ fontSize: 12, color: isOnline ? '#53815a' : '#9f2f1f', fontWeight: '600' }}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
                            </View>
                            {c.serial_number ? <Text style={styles.capteurSerial}>N° {c.serial_number}</Text> : null}
                          </View>
                          <Pressable style={styles.deleteBtn} onPress={() => handleDelete(c)}>
                            <Text style={styles.deleteBtnText}>Supprimer</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
              
              {capteurs.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#8a9a8b', marginTop: 10, fontStyle: 'italic' }}>
                  Aucun capteur
                </Text>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Puces Bétail (RFID)</Text>
            <Text style={styles.sectionSubtitle}>Suivi du cheptel par troupeaux.</Text>

            <Pressable style={[styles.actionBtn, { alignSelf: 'flex-start', marginVertical: 14 }]} onPress={() => Alert.alert('Simulation', 'Ouverture du scanner RFID...')}>
              <Text style={styles.actionBtnText}>+ Scanners de puces</Text>
            </Pressable>

            {betail.length === 0 && (
               <Text style={styles.empty}>Aucun troupeau enregistré.</Text>
            )}

            {betail.map(herd => (
              <View key={herd.id} style={styles.capteurRow}>
                <View style={styles.capteurInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.capteurName}>{herd.type}</Text>
                    <View style={[styles.statusDot, { backgroundColor: '#53815a' }]} />
                    <Text style={{ fontSize: 12, color: '#53815a', fontWeight: '600' }}>Actif ({herd.chips} puces)</Text>
                  </View>
                  <Text style={{ color: '#8a9a8b', fontSize: 12, marginTop: 2 }}>Localisation: {herd.localisation}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f6ef' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {tabs.map((tab) => (
          <Pressable 
            key={tab.id} 
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]} 
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau capteur</Text>
              <Pressable onPress={() => setModalOpen(false)}><Ionicons name="close" size={24} color="#1d2a1e" /></Pressable>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom (ex: Sonde Parcelle Nord)</Text>
              <TextInput style={styles.input} placeholder="Nom..." value={formName} onChangeText={setFormName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de série (optionnel)</Text>
              <TextInput style={styles.input} placeholder="A1B2..." value={formSerial} onChangeText={setFormSerial} />
            </View>
            <Pressable style={[styles.formActionPrimary, { padding: 14, borderRadius: 8, marginTop: 10 }, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving}>
              <Text style={styles.formActionPrimaryText}>{saving ? 'Enregistrement...' : 'Ajouter le capteur'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Gallery Modal */}
      <Modal visible={galleryModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Documents - {galleryType === 'terrains' ? 'Terrains' : 'Bétail'}</Text>
              <Pressable onPress={() => setGalleryModalOpen(false)}>
                <Ionicons name="close" size={24} color="#1d2a1e" />
              </Pressable>
            </View>
            
            <ScrollView style={{ maxHeight: 300 }}>
              <View style={{ gap: 10 }}>
                {galleryType === 'terrains' && (
                  <>
                    <View style={styles.documentItem}><Ionicons name="document" size={20} color="#21543d" /><Text style={styles.documentText}>Bail_Agricole_2024.pdf</Text></View>
                    <View style={styles.documentItem}><Ionicons name="document" size={20} color="#21543d" /><Text style={styles.documentText}>Declaration_PAC_2023.pdf</Text></View>
                    <View style={styles.documentItem}><Ionicons name="image" size={20} color="#21543d" /><Text style={styles.documentText}>Analyse_Sol_Parcelle_Nord.jpg</Text></View>
                  </>
                )}
                {galleryType === 'betail' && (
                  <>
                    <View style={styles.documentItem}><Ionicons name="document" size={20} color="#21543d" /><Text style={styles.documentText}>Passeport_Bovin_FR123.pdf</Text></View>
                    <View style={styles.documentItem}><Ionicons name="document" size={20} color="#21543d" /><Text style={styles.documentText}>Carnet_Sanitaire_2024.pdf</Text></View>
                    <View style={styles.documentItem}><Ionicons name="image" size={20} color="#21543d" /><Text style={styles.documentText}>Ordonnance_Veto_Mars.jpg</Text></View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#fffdf8', borderBottomWidth: 1, borderBottomColor: '#e0d8c7', maxHeight: 54 },
  tabBarContent: { paddingHorizontal: 16, alignItems: 'center', gap: 16, height: 54 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#21543d' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#8a9a8b' },
  tabTextActive: { color: '#21543d' },
  
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fffdf8', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e0d8c7', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1d2a1e' },
  sectionSubtitle: { fontSize: 13, color: '#8a9a8b', marginTop: 4, marginBottom: 8 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#4d5a4d', marginBottom: 6 },
  input: { backgroundColor: '#fffdf8', borderWidth: 1, borderColor: '#d3cfc1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1d2a1e' },
  
  empty: { color: '#8a9a8b', fontStyle: 'italic', fontSize: 14 },
  
  actionBtn: { backgroundColor: '#21543d', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  actionBtnText: { color: '#fffaf5', fontWeight: '800', fontSize: 14 },

  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0ebd8', padding: 12, borderRadius: 8 },
  deadlineDateBadge: { backgroundColor: '#e2d3b3', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  deadlineDateText: { fontSize: 12, fontWeight: '800', color: '#1d2a1e' },
  deadlineTitle: { fontSize: 15, fontWeight: '700', color: '#1d2a1e' },
  deadlineSub: { fontSize: 13, color: '#8a9a8b' },

  capteurRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f9f6ef', borderRadius: 8, borderWidth: 1, borderColor: '#e0d8c7' },
  capteurInfo: { flex: 1 },
  capteurName: { fontSize: 15, fontWeight: '700', color: '#1d2a1e' },
  capteurSerial: { fontSize: 12, color: '#8a9a8b', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  
  deleteBtn: { padding: 8, backgroundColor: '#fbe9e7', borderRadius: 6 },
  deleteBtnText: { color: '#c93c1f', fontSize: 12, fontWeight: '700' },
  safesContainer: { flexDirection: 'row', gap: 10, marginTop: 10 },
  safeCard: { flex: 1, backgroundColor: '#fbf6ea', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e0d8c7', alignItems: 'center' },
  safeTitle: { color: '#1d2a1e', fontWeight: '800', fontSize: 14, marginTop: 8, textAlign: 'center' },
  safeSub: { color: '#8a9a8b', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  safeBtn: { backgroundColor: '#f2eae1', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginTop: 'auto' },
  safeBtnText: { color: '#21543d', fontWeight: 'bold', fontSize: 12 },
  documentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#f9f6ef', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  documentText: { color: '#1d2a1e', fontWeight: '500', flex: 1 },

  dangerButton: { backgroundColor: '#fbe9e7', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  dangerButtonText: { color: '#9f2f1f', fontWeight: '800', fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29,42,30,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#f9f6ef', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1d2a1e' },
  formActionPrimary: { backgroundColor: '#21543d', alignItems: 'center' },
  formActionPrimaryText: { color: '#fffaf5', fontWeight: '800', fontSize: 15 }
});
