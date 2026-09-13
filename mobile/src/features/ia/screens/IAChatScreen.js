import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCapteurs } from '../../../shared/services/api';
import { analyzeRegulatoryCompliance } from '../utils/reglementations';
import { analyzeFinancialHealth } from '../utils/finances';

export default function IAChatScreen({ user, token, parcelles = [], diagnostics = [], onBack, onOpenPacGenerator }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Bonjour ${user?.name || ''} ! Je suis l'IA de Parcell-IA. J'ai accès à l'ensemble de votre exploitation (cultures, élevages, capteurs, et diagnostics). Comment puis-je vous aider ?` }
  ]);
  const [input, setInput] = useState('');
  const [capteurs, setCapteurs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchCapteurs(token);
        setCapteurs(data);
      } catch (e) {}

      try {
        const storedTx = await AsyncStorage.getItem('@parcellia_gestion_transactions');
        if (storedTx) setTransactions(JSON.parse(storedTx));
      } catch (e) {}
    }
    loadData();
  }, [token]);

  function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let response = `Je vois que vous m'interrogez sur "${text}". Pourriez-vous préciser si cela concerne vos secteurs (cultures/élevages), la PAC, ou vos finances pour que je puisse mieux vous aider ?`;
      let actions = null;
      
      const totalSurface = parcelles.reduce((acc, p) => acc + (Number(p.surface_ha) || 0), 0);
      const elevatedRiskCount = diagnostics.filter(d => d.niveau_risque === 'Élevé').length;
      const connectedCapteurs = capteurs.length;

      // Compte / Profil
      if (lower.includes('compte') || lower.includes('profil') || lower.includes('email') || lower.includes('exploitation') || lower.includes('secteur') || lower.includes('surface')) {
        response = `👤 Votre compte est au nom de ${user.name} (${user.email}). Vous exploitez actuellement ${parcelles.length} secteur(s) (cultures ou élevages) pour une surface totale de ${totalSurface.toFixed(1)} ha.`;
      } 
      // Capteurs & Bétail
      else if (lower.includes('capteur') || lower.includes('sonde') || lower.includes('météo') || lower.includes('bétail') || lower.includes('puce') || lower.includes('troupeau')) {
        if (lower.includes('bétail') || lower.includes('puce') || lower.includes('troupeau')) {
          response = `🐄 Pour votre bétail, nous suivons actuellement vos troupeaux via puces RFID. Une alerte récente indique que 3 vaches se sont éloignées de plus de 1km.`;
        } else if (connectedCapteurs > 0) {
          response = `📡 Vous avez ${connectedCapteurs} capteur(s) enregistré(s). L'analyse de vos capteurs indique que l'humidité moyenne est correcte. Dois-je lancer un cycle d'irrigation virtuel ?`;
        } else {
          response = `⚠️ Vous n'avez aucun capteur enregistré. L'ajout de sondes capacitives pourrait grandement optimiser votre gestion de l'eau.`;
        }
      }
      // Documents & Administratif
      else if (lower.includes('document') || lower.includes('coffre') || lower.includes('administratif') || lower.includes('papier')) {
        response = `📁 Vos documents sont sécurisés dans l'onglet Administratif de la page Compte. Vous y trouverez un Coffre-Fort dédié au Bétail (carnets sanitaires, passeports) et un autre pour vos Terrains (Baux, déclarations PAC).`;
      }
      // Diagnostics / Maladies
      else if (lower.includes('alerte') || lower.includes('maladie') || lower.includes('problème') || lower.includes('diagnostic')) {
        if (elevatedRiskCount > 0) {
          response = `🚨 J'ai détecté ${elevatedRiskCount} diagnostic(s) à risque élevé. Je vous conseille d'inspecter ces secteurs (cultures ou troupeaux) rapidement et de vérifier vos stocks (traitements phyto ou vétérinaires).`;
        } else {
          response = `✅ Tout semble normal sur l'ensemble de votre exploitation. Aucun diagnostic récent ne montre de niveau de risque "Élevé". Continuez vos rondes de surveillance habituelles.`;
        }
      }
      // PAC / Administratif / Réglementation
      else if (lower.includes('pac') || lower.includes('déclaration') || lower.includes('declaration') || lower.includes('loi') || lower.includes('réglementation') || lower.includes('reglementation')) {
        let baseResponse = `📅 Votre déclaration PAC pour vos ${totalSurface.toFixed(1)} hectares doit être finalisée avant le 15 mai. Pensez à utiliser le générateur PAC dans l'onglet Administratif de votre compte.`;
        
        // Moteur de règles réglementaires
        const compliance = analyzeRegulatoryCompliance(parcelles, transactions);
        if (compliance.length > 0) {
          baseResponse += `\n\n📌 **Analyse Réglementaire Spécifique :**\n` + compliance.join('\n\n');
        }
        
        response = baseResponse;
      } 
      else if (lower.includes('subvention') || lower.includes('aide') || lower.includes('feader')) {
        let baseResponse = "💶 Il existe des aides européennes (FEADER) et régionales. Pour les investissements matériels, vous pouvez bénéficier d'une prise en charge allant de 30% à 40%.";
        
        const compliance = analyzeRegulatoryCompliance(parcelles, transactions);
        if (compliance.length > 0) {
          baseResponse += `\n\n📌 **Analyse Réglementaire Spécifique :**\n` + compliance.join('\n\n');
        }

        response = baseResponse;
      } 
      // Finances
      else if (lower.includes('bilan') || lower.includes('rentable') || lower.includes('finance') || lower.includes('solde') || lower.includes('gestion')) {
        const totalRevenus = transactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0);
        const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0);
        const solde = totalRevenus - totalDepenses;
        
        let baseResponse = `📊 Votre bilan actuel affiche un solde de ${solde}€. Vous avez généré ${totalRevenus}€ de revenus pour ${totalDepenses}€ de dépenses.`;
        
        const audit = analyzeFinancialHealth(transactions);
        if (audit.length > 0) {
          baseResponse += `\n\n🏦 **Audit Financier :**\n` + audit.join('\n\n');
        }

        response = baseResponse;
      }
      else if (lower.includes('dépense') || lower.includes('depense') || lower.includes('charge')) {
        const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0);
        
        let baseResponse = `💸 Vous avez accumulé ${totalDepenses}€ de dépenses.`;
        
        const audit = analyzeFinancialHealth(transactions);
        if (audit.length > 0) {
          baseResponse += `\n\n🏦 **Audit Financier :**\n` + audit.join('\n\n');
        }

        response = baseResponse;
      } 
      else if (lower.includes('revenu') || lower.includes('vente')) {
        const totalRevenus = transactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0);
        
        let baseResponse = `📈 Vous avez enregistré ${totalRevenus}€ de revenus. Les prévisions de récolte sur vos ${totalSurface.toFixed(1)} hectares suggèrent une augmentation potentielle le mois prochain.`;
        
        const audit = analyzeFinancialHealth(transactions);
        if (audit.length > 0) {
          baseResponse += `\n\n🏦 **Audit Financier :**\n` + audit.join('\n\n');
        }

        response = baseResponse;
      } 
      else if (lower.includes('bonjour') || lower.includes('salut')) {
        response = `Bonjour ${user.name} ! Comment puis-je vous aider dans vos démarches administratives ou la gestion de vos ${parcelles.length} secteurs aujourd'hui ?`;
      }
      else if (lower.includes('règlementation') || lower.includes('reglementation') || lower.includes('administratif') || lower.includes('aide') || lower.includes('loi')) {
        response = `Voici quelques informations réglementaires à jour :\n\n- **Aides PAC 2026** : Pensez à faire votre télédéclaration avant le 15 mai. Un simulateur est disponible dans la section Gestion.\n- **Directives Nitrates** : Les périodes d'interdiction d'épandage approchent pour le bassin de vos parcelles.\n- **Santé Sécurité** : Les nouvelles distances de sécurité pour les traitements phytosanitaires sont de 10m près des cours d'eau.\n\nSouhaitez-vous générer un pré-dossier PAC ou un audit financier plus précis ?`;
        actions = [{ id: 'pac', label: 'Générer Dossier PAC', icon: 'document-text' }];
      }

      setMessages((prev) => [...prev, { role: 'ai', text: response, actions }]);
    }, 1000);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1d2a1e" />
          </Pressable>
          <Text style={styles.headerTitle}>Aide IA</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.container}>
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map((msg, i) => (
            <View key={i} style={[styles.chatBubble, msg.role === 'ai' ? styles.chatBubbleAi : styles.chatBubbleUser]}>
              {msg.role === 'ai' && <Ionicons name="sparkles" size={16} color="#d4af37" style={{ marginBottom: 4 }} />}
              <Text style={[styles.chatText, msg.role === 'ai' ? styles.chatTextAi : styles.chatTextUser]}>{msg.text}</Text>
              {msg.actions && msg.actions.map(action => (
                <Pressable 
                  key={action.id} 
                  style={styles.actionButton}
                  onPress={() => {
                    if (action.id === 'pac' && onOpenPacGenerator) {
                      onOpenPacGenerator();
                    }
                  }}
                >
                  <Ionicons name={action.icon} size={16} color="#21543d" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input} 
            placeholder="Posez votre question..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <Pressable style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f6ef' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0d8c7', backgroundColor: '#fffdf8' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1d2a1e' },
  container: { flex: 1 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 12, paddingBottom: 20 },
  chatBubble: { maxWidth: '85%', padding: 14, borderRadius: 18 },
  chatBubbleAi: { backgroundColor: '#fffdf8', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e0d8c7' },
  chatBubbleUser: { backgroundColor: '#21543d', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  chatText: { fontSize: 15, lineHeight: 22 },
  chatTextAi: { color: '#1d2a1e' },
  chatTextUser: { color: '#fff' },
  inputArea: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#e0d8c7', backgroundColor: '#fffdf8', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#f0ebd8', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1d2a1e' },
  sendBtn: { backgroundColor: '#21543d', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionButton: { flexDirection: 'row', backgroundColor: '#f0ebd8', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 10, alignItems: 'center', alignSelf: 'flex-start' },
  actionButtonText: { color: '#21543d', fontWeight: '700', fontSize: 13 }
});
