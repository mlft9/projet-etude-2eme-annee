import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@parcellia_gestion_transactions';

export default function GestionScreen({ parcelles = [], onOpenIAChat }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parcelle filtering
  const [selectedParcelleId, setSelectedParcelleId] = useState(null);

  // Modal Transaction
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('depense'); // 'depense' | 'revenu'
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [txParcelleId, setTxParcelleId] = useState(null);
  
  const [pacModalVisible, setPacModalVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Erreur de chargement des transactions", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction() {
    if (!amount || isNaN(parseFloat(amount)) || !label) return;

    const newTx = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      label,
      date: new Date().toISOString(),
      parcelleId: txParcelleId
    };

    const nextTransactions = [newTx, ...transactions];
    setTransactions(nextTransactions);
    
    setAmount('');
    setLabel('');
    setTxParcelleId(null);
    setModalVisible(false);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTransactions));
    } catch (e) {
      console.warn("Erreur de sauvegarde", e);
    }
  }

  async function handleDeleteTransaction(id) {
    const nextTransactions = transactions.filter(t => t.id !== id);
    setTransactions(nextTransactions);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTransactions));
    } catch (e) {
      console.warn("Erreur de suppression", e);
    }
  }



  const filteredTransactions = selectedParcelleId 
    ? transactions.filter(t => t.parcelleId === selectedParcelleId)
    : transactions;

  const totalDepenses = filteredTransactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0);
  const totalRevenus = filteredTransactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0);
  const solde = totalRevenus - totalDepenses;

  // Assistant PAC Data
  const totalSAU = parcelles.reduce((sum, p) => sum + Number(p.surface_ha || 0), 0);
  const surfaceByCulture = parcelles.reduce((acc, p) => {
    const culture = p.culture || 'Non définie';
    acc[culture] = (acc[culture] || 0) + Number(p.surface_ha || 0);
    return acc;
  }, {});

  const getStrategiesForParcelle = () => {
    if (!selectedParcelleId) return [];
    
    let strategies = [];
    if (selectedParcelleId === 'betail') {
      if (solde < 0) {
        strategies.push(`⚠️ Déficit sur l'élevage. Vérifiez vos coûts d'alimentation et frais vétérinaires récents.`);
      } else {
        strategies.push(`✅ Rentabilité positive sur le bétail. Bon suivi des coûts.`);
      }
      return strategies;
    }

    const p = parcelles.find(p => p.id === selectedParcelleId);
    if (solde < 0) {
      strategies.push(`⚠️ Le solde de ${p?.name} est déficitaire. Envisagez de réduire les apports d'intrants ce mois-ci.`);
    } else if (solde > 1000) {
      strategies.push(`✅ Trésorerie saine sur ${p?.name}. C'est le moment d'investir dans l'amélioration du système d'irrigation.`);
    }
    if (p && p.culture === 'Blé tendre') {
      strategies.push("🌾 Conseil Blé : Gardez un œil sur la rouille jaune avec la hausse d'humidité prévue.");
    }
    if (strategies.length === 0) {
      strategies.push("Tout semble normal pour ce secteur. Continuez le suivi régulier.");
    }
    return strategies;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#21543d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sélecteur de parcelle en haut */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <Pressable 
            style={[styles.tabBtn, selectedParcelleId === null && styles.tabBtnActive]} 
            onPress={() => setSelectedParcelleId(null)}>
            <Text style={[styles.tabBtnText, selectedParcelleId === null && styles.tabBtnTextActive]}>Toutes</Text>
          </Pressable>
          <Pressable 
            style={[styles.tabBtn, selectedParcelleId === 'betail' && styles.tabBtnActive]} 
            onPress={() => setSelectedParcelleId('betail')}>
            <Text style={[styles.tabBtnText, selectedParcelleId === 'betail' && styles.tabBtnTextActive]}>🐄 Mon Bétail</Text>
          </Pressable>
          {parcelles.map(p => (
            <Pressable 
              key={p.id}
              style={[styles.tabBtn, selectedParcelleId === p.id && styles.tabBtnActive]} 
              onPress={() => setSelectedParcelleId(p.id)}>
              <Text style={[styles.tabBtnText, selectedParcelleId === p.id && styles.tabBtnTextActive]}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, { backgroundColor: '#21543d' }]}>
            <Text style={styles.kpiLabelLight}>Solde Actuel {selectedParcelleId ? '(Parcelle)' : '(Global)'}</Text>
            <Text style={styles.kpiValueLight}>{solde.toFixed(2)} €</Text>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabel}>Revenus</Text>
              <Text style={[styles.kpiValue, { color: '#53815a' }]}>+{totalRevenus.toFixed(2)} €</Text>
            </View>
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabel}>Dépenses</Text>
              <Text style={[styles.kpiValue, { color: '#9f2f1f' }]}>-{totalDepenses.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        {/* Diagrammes d'état */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Bilan visuel</Text>
          {selectedParcelleId ? (
            <View style={styles.chartWrapper}>
              {(() => {
                const maxVal = Math.max(totalDepenses, totalRevenus, 1);
                return (
                  <>
                    <View style={styles.chartBarRow}>
                      <Text style={styles.chartBarLabel}>Revenus</Text>
                      <View style={styles.chartBarTrack}>
                        <View style={[styles.chartBarFill, { backgroundColor: '#53815a', width: `${(totalRevenus / maxVal) * 100}%` }]} />
                      </View>
                    </View>
                    <View style={styles.chartBarRow}>
                      <Text style={styles.chartBarLabel}>Dépenses</Text>
                      <View style={styles.chartBarTrack}>
                        <View style={[styles.chartBarFill, { backgroundColor: '#9f2f1f', width: `${(totalDepenses / maxVal) * 100}%` }]} />
                      </View>
                    </View>
                    <Text style={styles.chartInsight}>
                      {solde >= 0 ? "✅ Rentabilité positive sur cette parcelle." : "⚠️ Déficit observé sur cette parcelle."}
                    </Text>
                  </>
                );
              })()}
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <Text style={styles.chartInsight}>Solde par parcelle :</Text>
              {(() => {
                const maxSoldeAbs = Math.max(...parcelles.map(p => {
                  const pTx = transactions.filter(t => t.parcelleId === p.id);
                  return Math.abs(
                    pTx.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0) -
                    pTx.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0)
                  );
                }), 1);

                return parcelles.map(p => {
                  const pTx = transactions.filter(t => t.parcelleId === p.id);
                  const pRev = pTx.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0);
                  const pDep = pTx.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0);
                  const pSolde = pRev - pDep;
                  const isPos = pSolde >= 0;
                  const widthPct = (Math.abs(pSolde) / maxSoldeAbs) * 100;
                  
                  return (
                    <View key={p.id} style={styles.chartBarRow}>
                      <Text style={styles.chartBarLabel} numberOfLines={1}>{p.name}</Text>
                      <View style={styles.chartBarTrack}>
                        <View style={[styles.chartBarFill, { backgroundColor: isPos ? '#53815a' : '#9f2f1f', width: `${widthPct}%` }]} />
                      </View>
                      <Text style={[styles.chartBarValue, { color: isPos ? '#53815a' : '#9f2f1f' }]}>
                        {isPos ? '+' : ''}{pSolde.toFixed(0)} €
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          )}
        </View>

        <View style={styles.actionButtonsRow}>
          <Pressable style={styles.addButton} onPress={() => {
            setAmount(''); setLabel(''); setTxParcelleId(selectedParcelleId); setModalVisible(true);
          }}>
            <Ionicons name="add-circle-outline" size={20} color="#fffaf5" />
            <Text style={styles.addButtonText}>Nouvelle opération</Text>
          </Pressable>
          
          <Pressable style={styles.pacButton} onPress={() => setPacModalVisible(true)}>
            <Ionicons name="document-text-outline" size={20} color="#21543d" />
            <Text style={styles.pacButtonText}>Assistant PAC</Text>
          </Pressable>
        </View>

        {/* Intelligence Artificielle (Seulement si une parcelle est sélectionnée) */}
        {selectedParcelleId && (
          <View style={styles.aiContainer}>
            <View style={styles.cardAi}>
              <Text style={styles.sectionTitleAi}>IA Stratège 🧠</Text>
              <View style={styles.aiList}>
                {getStrategiesForParcelle().map((strat, idx) => (
                  <Text key={idx} style={styles.aiText}>• {strat}</Text>
                ))}
              </View>
            </View>

            <Pressable style={styles.iaButton} onPress={onOpenIAChat}>
              <Ionicons name="sparkles" size={16} color="#d4af37" style={{ marginRight: 6 }} />
              <Text style={styles.iaButtonText}>Aide IA Complète</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Historique</Text>
          
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>Aucune transaction enregistrée.</Text>
          ) : (
            filteredTransactions.map(t => {
              const isRevenu = t.type === 'revenu';
              const isBetail = t.parcelleId === 'betail';
              const parcelleAssociee = isBetail ? { name: 'Mon Bétail' } : parcelles.find(p => p.id === t.parcelleId);
              return (
                <View key={t.id} style={styles.transactionItem}>
                  <View style={styles.txIcon}>
                    <Ionicons name={isRevenu ? 'trending-up' : 'trending-down'} size={20} color={isRevenu ? '#53815a' : '#9f2f1f'} />
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txLabel}>{t.label}</Text>
                    <Text style={styles.txDate}>
                      {new Date(t.date).toLocaleDateString('fr-FR')}
                      {parcelleAssociee && !selectedParcelleId ? ` • ${parcelleAssociee.name}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isRevenu ? '#53815a' : '#9f2f1f' }]}>
                    {isRevenu ? '+' : '-'}{t.amount.toFixed(2)} €
                  </Text>
                  <Pressable onPress={() => handleDeleteTransaction(t.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#9aa49a" />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal d'ajout */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouvelle opération</Text>
            
            <View style={styles.typeSelector}>
              <Pressable style={[styles.typeBtn, type === 'depense' && styles.typeBtnActiveD]} onPress={() => setType('depense')}>
                <Text style={[styles.typeBtnText, type === 'depense' && styles.typeBtnTextActive]}>Dépense</Text>
              </Pressable>
              <Pressable style={[styles.typeBtn, type === 'revenu' && styles.typeBtnActiveR]} onPress={() => setType('revenu')}>
                <Text style={[styles.typeBtnText, type === 'revenu' && styles.typeBtnTextActive]}>Revenu</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Secteur associé</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parcellePickerScroll}>
                <Pressable style={[styles.parcelleBadge, txParcelleId === null && styles.parcelleBadgeActive]} onPress={() => setTxParcelleId(null)}>
                  <Text style={[styles.parcelleBadgeText, txParcelleId === null && styles.parcelleBadgeTextActive]}>Aucun (Global)</Text>
                </Pressable>
                <Pressable style={[styles.parcelleBadge, txParcelleId === 'betail' && styles.parcelleBadgeActive]} onPress={() => setTxParcelleId('betail')}>
                  <Text style={[styles.parcelleBadgeText, txParcelleId === 'betail' && styles.parcelleBadgeTextActive]}>🐄 Mon Bétail</Text>
                </Pressable>
                {parcelles.map(p => (
                  <Pressable key={p.id} style={[styles.parcelleBadge, txParcelleId === p.id && styles.parcelleBadgeActive]} onPress={() => setTxParcelleId(p.id)}>
                    <Text style={[styles.parcelleBadgeText, txParcelleId === p.id && styles.parcelleBadgeTextActive]}>{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="ex : Achat semences, Facture eau" placeholderTextColor="#aaa" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Montant (€)</Text>
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="ex : 150" placeholderTextColor="#aaa" />
            </View>

            <View style={styles.formActions}>
              <Pressable style={[styles.formAction, styles.formActionGhost]} onPress={() => setModalVisible(false)}>
                <Text style={styles.formActionGhostText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.formAction, styles.formActionPrimary, (!amount || !label) && styles.disabled]} onPress={handleAddTransaction} disabled={!amount || !label}>
                <Text style={styles.formActionPrimaryText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal PAC */}
      <Modal visible={pacModalVisible} transparent animationType="fade" onRequestClose={() => setPacModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPacModalVisible(false)} />
          
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Récapitulatif PAC</Text>
            
            <ScrollView style={styles.pacScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.pacBlock}>
                <Text style={styles.pacBlockTitle}>Surface Agricole Utile (SAU)</Text>
                <Text style={styles.pacBlockValue}>{totalSAU.toFixed(2)} hectares</Text>
              </View>

              <View style={styles.pacBlock}>
                <Text style={styles.pacBlockTitle}>Répartition par culture</Text>
                {Object.entries(surfaceByCulture).map(([culture, surface]) => (
                  <View key={culture} style={styles.pacRow}>
                    <Text style={styles.pacRowLabel}>{culture}</Text>
                    <Text style={styles.pacRowValue}>{surface.toFixed(2)} ha</Text>
                  </View>
                ))}
              </View>

              <View style={styles.pacBlock}>
                <Text style={styles.pacBlockTitle}>Coordonnées des parcelles</Text>
                {parcelles.map(p => (
                  <View key={p.id} style={styles.pacRow}>
                    <Text style={styles.pacRowLabel}>{p.name}</Text>
                    <Text style={styles.pacRowValueCoords}>
                      {p.latitude ? `${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}` : 'Non géolocalisée'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <Pressable style={[styles.formAction, styles.formActionPrimary]} onPress={() => setPacModalVisible(false)}>
              <Text style={styles.formActionPrimaryText}>Fermer</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f0e8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { backgroundColor: '#fffdf8', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0d8c7' },
  tabScroll: { paddingHorizontal: 20, gap: 10 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f3f0e8', borderWidth: 1, borderColor: '#e0d8c7' },
  tabBtnActive: { backgroundColor: '#21543d', borderColor: '#21543d' },
  tabBtnText: { color: '#677267', fontWeight: '700', fontSize: 14 },
  tabBtnTextActive: { color: '#fffdf8' },

  content: { padding: 20, gap: 20, paddingBottom: 110 },
  kpiContainer: { gap: 12 },
  kpiCard: { borderRadius: 22, padding: 24, alignItems: 'center', gap: 4, elevation: 4 },
  kpiLabelLight: { color: '#e8e1d3', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  kpiValueLight: { color: '#fffaf5', fontSize: 32, fontWeight: '800' },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCardSmall: { flex: 1, backgroundColor: '#fffdf8', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e0d8c7', alignItems: 'center' },
  kpiLabel: { color: '#677267', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  
  chartCard: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#e0d8c7' },
  chartWrapper: { marginTop: 12, gap: 12 },
  chartBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chartBarLabel: { width: 70, color: '#677267', fontSize: 13, fontWeight: '700' },
  chartBarTrack: { flex: 1, height: 12, backgroundColor: '#f3efe6', borderRadius: 6, overflow: 'hidden' },
  chartBarFill: { height: '100%', borderRadius: 6 },
  chartBarValue: { width: 50, textAlign: 'right', fontSize: 13, fontWeight: '800', color: '#1d2a1e' },
  chartInsight: { color: '#4d5a4d', fontSize: 14, fontStyle: 'italic', marginTop: 6 },
  
  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  addButton: { flex: 1, backgroundColor: '#c96c2d', borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addButtonText: { color: '#fffaf5', fontWeight: '800', fontSize: 15 },
  pacButton: { flex: 1, backgroundColor: '#e8e1d3', borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pacButtonText: { color: '#21543d', fontWeight: '800', fontSize: 15 },
  
  aiContainer: { gap: 16 },
  cardAi: { backgroundColor: '#1d2a1e', borderRadius: 22, padding: 18, gap: 14 },
  sectionTitleAi: { color: '#fffdf8', fontSize: 20, fontWeight: '800' },
  aiList: { gap: 12 },
  aiText: { color: '#e0d8c7', fontSize: 15, lineHeight: 22, fontWeight: '500' },
  
  iaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#334135', borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#4a5b4c', marginTop: 10 },
  iaButtonText: { color: '#fffdf8', fontWeight: '800', fontSize: 15 },

  listContainer: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#e0d8c7', minHeight: 200 },
  sectionTitle: { color: '#1d2a1e', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  emptyText: { color: '#8a9a8b', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee7d8', gap: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3efe6', alignItems: 'center', justifyContent: 'center' },
  txDetails: { flex: 1 },
  txLabel: { color: '#1d2a1e', fontSize: 15, fontWeight: '700' },
  txDate: { color: '#8a9a8b', fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  deleteBtn: { padding: 4, marginLeft: 4 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29, 42, 30, 0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: '#fffdf8', borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: '#e0d8c7', elevation: 8 },
  modalTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  typeSelector: { flexDirection: 'row', backgroundColor: '#e8e1d3', borderRadius: 12, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeBtnActiveD: { backgroundColor: '#9f2f1f' },
  typeBtnActiveR: { backgroundColor: '#53815a' },
  typeBtnText: { color: '#677267', fontWeight: '700', fontSize: 14 },
  typeBtnTextActive: { color: '#fffdf8' },
  
  parcellePickerScroll: { gap: 8, paddingVertical: 4 },
  parcelleBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f3f0e8', borderWidth: 1, borderColor: '#e0d8c7' },
  parcelleBadgeActive: { backgroundColor: '#21543d', borderColor: '#21543d' },
  parcelleBadgeText: { color: '#677267', fontSize: 13, fontWeight: '600' },
  parcelleBadgeTextActive: { color: '#fffdf8' },

  field: { gap: 8 },
  label: { color: '#374238', fontWeight: '700', fontSize: 15 },
  input: { backgroundColor: '#f3efe6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1d2a1e', borderWidth: 1, borderColor: '#d8d0c0' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  formAction: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  formActionGhost: { backgroundColor: '#e8e1d3' },
  formActionGhostText: { color: '#4d5a4d', fontWeight: '700' },
  formActionPrimary: { backgroundColor: '#21543d' },
  formActionPrimaryText: { color: '#fffaf5', fontWeight: '800' },
  disabled: { opacity: 0.5 },
  
  pacScroll: { maxHeight: 300, marginBottom: 10 },
  pacBlock: { marginBottom: 16, backgroundColor: '#f3efe6', padding: 12, borderRadius: 12 },
  pacBlockTitle: { color: '#677267', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  pacBlockValue: { color: '#1d2a1e', fontSize: 16, fontWeight: '800' },
  pacRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d8d0c0' },
  pacRowLabel: { color: '#374238', fontSize: 14, fontWeight: '600' },
  pacRowValue: { color: '#21543d', fontSize: 14, fontWeight: '800' },
  pacRowValueCoords: { color: '#677267', fontSize: 13, fontVariant: ['tabular-nums'] }
});
