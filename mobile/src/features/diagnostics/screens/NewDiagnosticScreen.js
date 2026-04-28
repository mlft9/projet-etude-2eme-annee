import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../../../config';

export default function NewDiagnosticScreen({ parcelles, selectedParcelleId, onSelectParcelle, onSubmit, submitting }) {
  const [selectedImage, setSelectedImage] = useState(null);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès refusé', 'Autorise la caméra pour photographier la plante.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]) setSelectedImage(result.assets[0]);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès refusé', 'Autorise la photothèque pour envoyer une image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]) setSelectedImage(result.assets[0]);
  }

  async function handleSubmit() {
    if (!selectedImage?.base64) {
      Alert.alert('Image requise', "Choisis une photo de feuille ou de plante avant de lancer l'analyse.");
      return;
    }
    await onSubmit({ parcelle_id: selectedParcelleId, image_base64: selectedImage.base64 });
    setSelectedImage(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Associer la parcelle</Text>
        <View style={styles.pillRow}>
          {parcelles.map((parcelle) => {
            const active = selectedParcelleId === parcelle.id;
            return (
              <Pressable key={parcelle.id} style={[styles.pill, active ? styles.pillActive : null]} onPress={() => onSelectParcelle(parcelle.id)}>
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{parcelle.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photo a analyser</Text>
        <View style={styles.imageSourceRow}>
          <Pressable style={[styles.primaryButton, styles.imageBtn]} onPress={takePhoto}>
            <Text style={styles.primaryButtonText}>Prendre une photo</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, styles.imageBtn]} onPress={pickImage}>
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
        <Text style={styles.helperText}>Le backend tourne sur {API_BASE_URL}.</Text>
        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Analyse en cours...' : 'Lancer le diagnostic'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionTitle: { color: '#1d2a1e', fontSize: 18, fontWeight: '800' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: '#ece3d5', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  pillActive: { backgroundColor: '#21543d' },
  pillText: { color: '#506052', fontWeight: '700' },
  pillTextActive: { color: '#fffdf8' },
  imageSourceRow: { flexDirection: 'row', gap: 10 },
  imageBtn: { flex: 1, alignItems: 'center' },
  primaryButton: { backgroundColor: '#c96c2d', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 15 },
  secondaryButton: { backgroundColor: '#e8e1d3', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  secondaryButtonText: { color: '#4d5a4d', fontWeight: '700' },
  helperText: { color: '#6c776d', fontSize: 13, lineHeight: 19 },
  previewBlock: { gap: 10 },
  previewImage: { width: '100%', height: 240, borderRadius: 18, backgroundColor: '#ddd4c2' },
});
