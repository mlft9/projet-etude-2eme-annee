import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function IrrigationRefinementModal({ visible, onClose, onSave }) {
  const [pluviometrie, setPluviometrie] = useState('');
  const [lastIrrigationDays, setLastIrrigationDays] = useState('');

  function handleSave() {
    onSave({
      pluviometrie: pluviometrie ? parseFloat(pluviometrie) : null,
      lastIrrigationDays: lastIrrigationDays ? parseInt(lastIrrigationDays, 10) : null,
    });
    // Réinitialiser après sauvegarde
    setPluviometrie('');
    setLastIrrigationDays('');
    onClose();
  }

  function handleClose() {
    setPluviometrie('');
    setLastIrrigationDays('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalCard} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>Affiner les données d'irrigation</Text>
          <Text style={styles.hint}>
            Les capteurs n'ont pas assez d'historique. Remplissez ces informations manuelles pour un meilleur calcul du stress hydrique.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Pluviométrie des 3 derniers jours (mm)</Text>
            <TextInput
              style={styles.input}
              value={pluviometrie}
              onChangeText={setPluviometrie}
              keyboardType="decimal-pad"
              placeholder="ex : 15"
              placeholderTextColor="#aaa"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Il y a combien de jours avez-vous irrigué ?</Text>
            <TextInput
              style={styles.input}
              value={lastIrrigationDays}
              onChangeText={setLastIrrigationDays}
              keyboardType="number-pad"
              placeholder="ex : 2"
              placeholderTextColor="#aaa"
            />
          </View>

          <View style={styles.formActions}>
            <Pressable style={[styles.formAction, styles.formActionGhost]} onPress={handleClose}>
              <Text style={styles.formActionGhostText}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.formAction, styles.formActionPrimary]} onPress={handleSave}>
              <Text style={styles.formActionPrimaryText}>Calculer</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29, 42, 30, 0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalScroll: { maxHeight: '85%' },
  modalCard: { backgroundColor: '#fffdf8', borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: '#e0d8c7', elevation: 8 },
  modalTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  hint: { color: '#6c776d', fontSize: 14, lineHeight: 21 },
  field: { gap: 8 },
  label: { color: '#374238', fontWeight: '700', fontSize: 16 },
  input: { backgroundColor: '#f3efe6', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 18, fontSize: 17, color: '#1d2a1e', borderWidth: 1, borderColor: '#d8d0c0' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  formAction: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  formActionGhost: { backgroundColor: '#e8e1d3' },
  formActionGhostText: { color: '#4d5a4d', fontWeight: '700' },
  formActionPrimary: { backgroundColor: '#21543d' },
  formActionPrimaryText: { color: '#fffaf5', fontWeight: '800' },
});
