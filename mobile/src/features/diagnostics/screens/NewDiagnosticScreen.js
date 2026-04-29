import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../../../config';

export default function NewDiagnosticScreen({ parcelles, selectedParcelleId, onSelectParcelle, onSubmit, submitting, initialImage, onViewPlant }) {
  const [selectedImage, setSelectedImage] = useState(initialImage || null);

  useEffect(() => {
    setSelectedImage(initialImage || null);
  }, [initialImage]);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès refusé', 'Autorise la caméra pour photographier la plante.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]) setSelectedImage(result.assets[0]);
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès refusé', 'Autorise la photothèque pour envoyer une image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.7, base64: true });
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Text style={[styles.pillSubtext, active ? styles.pillSubtextActive : null]}>{parcelle.surface_ha}ha</Text>
                  {onViewPlant && (
                    <>
                      <Text style={[styles.pillSubtext, active ? styles.pillSubtextActive : null]}>•</Text>
                      <Pressable onPress={() => onViewPlant(parcelle.culture)}>
                        <Text style={[styles.pillSubtext, styles.cultureSubtext]}>{parcelle.culture}</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photo a analyser</Text>
        {selectedImage ? (
          <View style={styles.previewBlock}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <Text style={styles.helperText}>Image prete pour l analyse IA</Text>
            <View style={styles.imageSourceRow}>
              <Pressable style={[styles.secondaryButton, styles.imageBtn]} onPress={takePhoto}>
                <Text style={styles.secondaryButtonText}>Reprendre</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.imageBtn]} onPress={pickImage}>
                <Text style={styles.secondaryButtonText}>Galerie</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imageSourceRow}>
              <Pressable style={[styles.primaryButton, styles.imageBtn]} onPress={takePhoto}>
                <Text style={styles.primaryButtonText}>Prendre une photo</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.imageBtn]} onPress={pickImage}>
                <Text style={styles.secondaryButtonText}>Galerie</Text>
              </Pressable>
            </View>
            <Text style={styles.helperText}>Aucune image selectionnee</Text>
          </>
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
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { backgroundColor: '#ece3d5', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 16 },
  pillActive: { backgroundColor: '#21543d' },
  pillText: { color: '#506052', fontWeight: '700', fontSize: 15 },
  pillTextActive: { color: '#fffdf8' },
  pillSubtext: { color: '#506052', fontWeight: '500', fontSize: 12 },
  pillSubtextActive: { color: '#fffdf8' },
  cultureSubtext: { color: '#c96c2d', fontWeight: '700', textDecorationLine: 'underline' },
  imageSourceRow: { flexDirection: 'row', gap: 10 },
  imageBtn: { flex: 1, alignItems: 'center' },
  primaryButton: { backgroundColor: '#c96c2d', borderRadius: 16, paddingVertical: 22, alignItems: 'center' },
  primaryButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 17 },
  secondaryButton: { backgroundColor: '#e8e1d3', paddingHorizontal: 20, paddingVertical: 18, borderRadius: 14 },
  secondaryButtonText: { color: '#4d5a4d', fontWeight: '700', fontSize: 16 },
  helperText: { color: '#6c776d', fontSize: 15, lineHeight: 22 },
  previewBlock: { gap: 10 },
  previewImage: { width: '100%', height: 240, borderRadius: 18, backgroundColor: '#ddd4c2' },
});
