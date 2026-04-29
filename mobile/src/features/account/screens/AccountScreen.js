import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_BASE_URL } from '../../../config';
import { fetchCapteurs, createCapteur, deleteCapteur } from '../../../shared/services/api';

export default function AccountScreen({ user, token, onLogout }) {
  const [capteurs, setCapteurs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [saving, setSaving] = useState(false);

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

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>API</Text>
          <Text style={styles.value} numberOfLines={1}>{API_BASE_URL}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes capteurs</Text>
          <Pressable style={styles.addButton} onPress={() => { setFormName(''); setFormSerial(''); setModalOpen(true); }}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </Pressable>
        </View>

        {capteurs.length === 0 && (
          <Text style={styles.empty}>Aucun capteur enregistré.</Text>
        )}

        {capteurs.map((c) => (
          <View key={c.id} style={styles.capteurRow}>
            <View style={styles.capteurInfo}>
              <Text style={styles.capteurName}>{c.name}</Text>
              {c.serial_number ? (
                <Text style={styles.capteurSerial}>N° {c.serial_number}</Text>
              ) : null}
              {c.parcelle_id ? (
                <Text style={styles.capteurAssoc}>Associé à une parcelle</Text>
              ) : (
                <Text style={styles.capteurFree}>Non associé</Text>
              )}
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(c)}>
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable style={styles.dangerButton} onPress={onLogout}>
        <Text style={styles.dangerButtonText}>Se deconnecter</Text>
      </Pressable>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!saving) setModalOpen(false); }} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau capteur</Text>

            <View style={styles.modalField}>
              <Text style={styles.formLabel}>Nom du capteur</Text>
              <TextInput
                style={styles.formInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ex: Capteur Nord"
                placeholderTextColor="#9aa49a"
                autoFocus
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.formLabel}>Numéro de série (optionnel)</Text>
              <TextInput
                style={styles.formInput}
                value={formSerial}
                onChangeText={setFormSerial}
                placeholder="Ex: SN-2024-001"
                placeholderTextColor="#9aa49a"
              />
            </View>

            <View style={styles.formActions}>
              <Pressable style={[styles.formAction, styles.formActionGhost]} onPress={() => setModalOpen(false)} disabled={saving}>
                <Text style={styles.formActionGhostText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.formAction, styles.formActionPrimary, saving && styles.formActionDisabled]} onPress={handleCreate} disabled={saving}>
                <Text style={styles.formActionPrimaryText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 16 },
  label: { color: '#677267', fontWeight: '600', fontSize: 15 },
  value: { color: '#1d2a1e', fontWeight: '700', fontSize: 15, maxWidth: '65%', textAlign: 'right' },
  addButton: { backgroundColor: '#21543d', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addButtonText: { color: '#fffdf8', fontWeight: '700', fontSize: 13 },
  empty: { color: '#8a9a8b', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  capteurRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee7d8', paddingTop: 12 },
  capteurInfo: { flex: 1, gap: 2 },
  capteurName: { color: '#1d2a1e', fontWeight: '700', fontSize: 15 },
  capteurSerial: { color: '#677267', fontSize: 13 },
  capteurAssoc: { color: '#21543d', fontSize: 12, fontWeight: '600' },
  capteurFree: { color: '#c96c2d', fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#f5e8e3', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  deleteBtnText: { color: '#9f2f1f', fontWeight: '700', fontSize: 13 },
  dangerButton: { backgroundColor: '#9f2f1f', borderRadius: 16, paddingVertical: 22, alignItems: 'center' },
  dangerButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29, 42, 30, 0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: '#fffdf8', borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: '#e0d8c7', elevation: 8 },
  modalTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  modalField: { gap: 6 },
  formLabel: { color: '#677267', fontWeight: '600', fontSize: 13 },
  formInput: { borderWidth: 1, borderColor: '#e0d8c7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#1d2a1e', backgroundColor: '#fbf6ea' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  formAction: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  formActionGhost: { backgroundColor: '#e8e1d3' },
  formActionGhostText: { color: '#4d5a4d', fontWeight: '700' },
  formActionPrimary: { backgroundColor: '#21543d' },
  formActionPrimaryText: { color: '#fffaf5', fontWeight: '800' },
  formActionDisabled: { opacity: 0.6 },
});
