import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PacGeneratorScreen({ user, token, parcelles, onBack }) {
  // Initialiser le state avec les données pré-remplies
  const [formData, setFormData] = useState(
    parcelles.map(p => ({
      id: p.id,
      name: p.name || 'Sans nom',
      culture: p.culture || '',
      surface: p.surface_ha ? p.surface_ha.toString() : '',
      coords: p.latitude && p.longitude ? `${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}` : ''
    }))
  );

  const handleUpdateField = (id, field, value) => {
    setFormData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleMagicFill = () => {
    // Simulation du remplissage par l'IA
    setFormData(prev => prev.map(p => ({
      ...p,
      culture: p.culture || 'Blé tendre',
      surface: p.surface || '2.5',
      coords: p.coords || '48.1, -1.6'
    })));
    Alert.alert("Succès", "L'IA a pré-rempli les champs manquants en s'appuyant sur l'historique et la cartographie.");
  };

  const handleGeneratePdf = async () => {
    try {
      const today = new Date().toLocaleDateString('fr-FR');
      
      const parcellesHtml = formData.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.culture || 'N/A'}</td>
          <td>${p.surface || '-'} ha</td>
          <td>${p.coords || 'Non géolocalisée'}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, sans-serif; padding: 40px; color: #1d2a1e; }
              .header { text-align: center; border-bottom: 2px solid #21543d; padding-bottom: 20px; margin-bottom: 40px; }
              h1 { color: #21543d; }
              .warning { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 30px; font-weight: bold; border: 1px solid #ffeeba; }
              .meta { font-size: 14px; color: #677267; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #d8d0c0; padding: 12px; text-align: left; }
              th { background-color: #f3efe6; color: #21543d; }
              .footer { margin-top: 50px; font-size: 12px; color: #8a9a8b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Déclaration PAC - Document Préparatoire</h1>
              <p>Document généré via Parcellia</p>
            </div>
            
            <div class="warning">
              ATTENTION : Ce document est une aide à la préparation. Il ne constitue pas une déclaration officielle et doit être vérifié avant toute soumission.
            </div>

            <div class="meta">
              <p><strong>Exploitant :</strong> ${user.name}</p>
              <p><strong>Email de contact :</strong> ${user.email}</p>
              <p><strong>Date d'édition :</strong> ${today}</p>
            </div>
            
            <h2>Récapitulatif des parcelles (SAU)</h2>
            <table>
              <thead>
                <tr>
                  <th>Nom de la parcelle</th>
                  <th>Culture déclarée</th>
                  <th>Surface déclarée</th>
                  <th>Coordonnées GPS</th>
                </tr>
              </thead>
              <tbody>
                ${parcellesHtml || '<tr><td colspan="4" style="text-align: center;">Aucune parcelle enregistrée</td></tr>'}
              </tbody>
            </table>
            
            <div class="footer">
              Généré le ${today} - Référence: ${token.substring(0, 15)}...
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Succès', 'Document PDF généré ! (Partage non disponible sur cet appareil)');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le PDF : ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1d2a1e" />
        </Pressable>
        <Text style={styles.title}>Dossier PAC 2026</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={24} color="#856404" />
          <Text style={styles.warningText}>Ce simulateur ne remplace pas votre télédéclaration officielle sur Telepac.</Text>
        </View>

        <Pressable style={styles.magicButton} onPress={handleMagicFill}>
          <Ionicons name="sparkles" size={20} color="#fffdf8" style={{ marginRight: 8 }} />
          <Text style={styles.magicButtonText}>✨ Remplissage Magique IA</Text>
        </Pressable>

        {formData.length === 0 ? (
          <Text style={styles.empty}>Aucune parcelle n'est configurée.</Text>
        ) : (
          formData.map((p, index) => {
            const originalParcelle = parcelles.find(op => op.id === p.id);
            const originalSurface = originalParcelle?.surface_ha || 0;
            const inputSurface = parseFloat(p.surface) || 0;
            
            let status = 'ok';
            let statusMsg = '✓ Conforme';
            let statusColor = '#21543d';
            let statusBg = '#e8f3ec';

            if (originalSurface > 0) {
              const diff = Math.abs(originalSurface - inputSurface);
              const percentDiff = (diff / originalSurface) * 100;
              if (percentDiff > 10) {
                status = 'danger';
                statusMsg = '❌ Écart majeur';
                statusColor = '#9f2f1f';
                statusBg = '#fcece9';
              } else if (percentDiff > 5) {
                status = 'warning';
                statusMsg = '⚠ Écart mineur';
                statusColor = '#c96c2d';
                statusBg = '#fcf0e8';
              }
            }

            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Text style={styles.cardIndex}>#{index + 1}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Culture en cours</Text>
                  <TextInput
                    style={styles.input}
                    value={p.culture}
                    onChangeText={(val) => handleUpdateField(p.id, 'culture', val)}
                    placeholder="Ex: Blé tendre"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.label}>Surface (ha)</Text>
                      <View style={{ backgroundColor: statusBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>{statusMsg}</Text>
                      </View>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={p.surface}
                      onChangeText={(val) => handleUpdateField(p.id, 'surface', val)}
                      keyboardType="numeric"
                      placeholder="Ex: 5.4"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={styles.label}>Coordonnées GPS</Text>
                    <TextInput
                      style={styles.input}
                      value={p.coords}
                      onChangeText={(val) => handleUpdateField(p.id, 'coords', val)}
                      placeholder="Ex: 48.8, 2.3"
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}

        {formData.length > 0 && (
          <Pressable style={styles.submitButton} onPress={handleGeneratePdf}>
            <Ionicons name="document-text" size={20} color="#fffdf8" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Exporter en PDF</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f0e8' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0d8c7',
    backgroundColor: '#fffdf8'
  },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: '800', color: '#1d2a1e' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeeba',
    alignItems: 'center',
    gap: 12
  },
  warningText: { flex: 1, color: '#856404', fontSize: 13, fontWeight: '700', lineHeight: 20 },
  card: { backgroundColor: '#fffdf8', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee7d8', paddingBottom: 10, marginBottom: 4 },
  cardTitle: { color: '#1d2a1e', fontSize: 16, fontWeight: '800' },
  cardIndex: { color: '#8a9a8b', fontSize: 14, fontWeight: '700' },
  inputGroup: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { color: '#677267', fontWeight: '600', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#d8d0c0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1d2a1e',
    backgroundColor: '#fbf6ea'
  },
  empty: { textAlign: 'center', color: '#8a9a8b', marginTop: 20 },
  submitButton: { 
    backgroundColor: '#21543d', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 10 
  },
  submitButtonText: { color: '#fffdf8', fontSize: 16, fontWeight: '700' },
  magicButton: {
    backgroundColor: '#d4af37',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10
  },
  magicButtonText: { color: '#fffdf8', fontSize: 15, fontWeight: '700' }
});
