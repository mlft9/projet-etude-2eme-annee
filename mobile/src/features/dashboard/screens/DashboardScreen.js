import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Linking, Modal } from 'react-native';
import StatCard from '../components/StatCard';
import DiagnosticCard from '../../diagnostics/components/DiagnosticCard';
import RiskBadge from '../../diagnostics/components/RiskBadge';
import { fetchIrrigationForecast } from '../../../shared/services/weather';
import { analyzeClimateRisk, analyzeFireRisk } from '../../parcelles/utils/climateLogic';
import { fetchCapteursForParcelle } from '../../../shared/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ user, parcelles, betail = [], diagnostics, refreshing, onRefresh, onViewAllDiagnostics, onNavigateToMap }) {
  const elevatedCount = diagnostics.filter((d) => d.niveau_risque === 'Élevé').length;
  
  const [climateAlerts, setClimateAlerts] = useState([]);
  const [parcellesExpanded, setParcellesExpanded] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [alertsRead, setAlertsRead] = useState(false);

  useEffect(() => {
    async function fetchClimateAlerts() {
      let allAlerts = [];
      for (const parcelle of parcelles) {
        if (parcelle.latitude && parcelle.longitude) {
          const weather = await fetchIrrigationForecast(parcelle.latitude, parcelle.longitude);
          if (weather) {
            // Check for climate risk
            const risks = analyzeClimateRisk(weather);
            if (risks.length > 0) {
              allAlerts.push({
                parcelleId: parcelle.id,
                parcelleName: parcelle.name,
                ...risks[0]
              });
            }
            
            // Check for fire risk
            try {
              const capteurs = await fetchCapteursForParcelle(parcelle.id);
              let soilHum = null;
              if (capteurs && capteurs.length > 0 && capteurs[0].latest) {
                soilHum = capteurs[0].latest.humidite;
              }
              const fireRisks = analyzeFireRisk(weather, soilHum);
              if (fireRisks.length > 0) {
                allAlerts.push({
                  parcelleId: parcelle.id,
                  parcelleName: parcelle.name,
                  ...fireRisks[0]
                });
              }
            } catch (e) {
               // Ignore capteur fetch error
               const fireRisks = analyzeFireRisk(weather, null);
               if (fireRisks.length > 0) {
                 allAlerts.push({
                   parcelleId: parcelle.id,
                   parcelleName: parcelle.name,
                   ...fireRisks[0]
                 });
               }
            }
          }
        }
      }

      // Simulation de l'Alerte Fugue Bétail (> 1km)
      allAlerts.push({
        type: 'fugue',
        parcelleName: 'Troupeau Bovins Laitiers',
        title: 'Vaches égarées (Fugue)',
        message: '3 puces RFID (#45, #12, #8) sont à plus de 1.2km du troupeau principal.',
        score: 95
      });

      setClimateAlerts(allAlerts);
    }
    
    if (parcelles.length > 0) {
      fetchClimateAlerts();
    }
  }, [parcelles]);

  // Fil d'actualité réglementaire mock
  const [news, setNews] = useState([]);
  
  useEffect(() => {
    const cultures = [...new Set(parcelles.map(p => p.culture).filter(Boolean).map(c => c.toLowerCase()))];
    const allNews = [
      { id: 1, title: 'Nouvelle norme nitrates', desc: 'Applicable dès le 1er septembre pour les grandes cultures.', url: 'https://agriculture.gouv.fr', tags: ['blé', 'maïs', 'grandes cultures', 'orge', 'colza'], date: "Aujourd'hui", isAI: true },
      { id: 2, title: 'Aides Sécheresse 2026', desc: 'Guichet ouvert pour les pertes sur vergers.', url: 'https://www.europe-en-france.gouv.fr/fr', tags: ['verger', 'pomme', 'arboriculture', 'vigne'], date: "Hier", isAI: true },
      { id: 3, title: 'Réglementation Phyto', desc: "Distance de sécurité étendue près des cours d'eau.", url: 'https://www.legifrance.gouv.fr', tags: ['all'], date: "Il y a 3 jours", isAI: true }
    ];

    const filteredNews = allNews.filter(n => {
      if (n.tags.includes('all')) return true;
      return cultures.some(userCulture => n.tags.some(tag => userCulture.includes(tag)));
    });
    
    setNews(filteredNews.length > 0 ? filteredNews : [allNews[2]]);
  }, [parcelles]);

  const chartData = {
    high: elevatedCount,
    medium: diagnostics.filter((d) => d.niveau_risque === 'Moyen').length,
    low: diagnostics.filter((d) => d.niveau_risque === 'Faible').length,
  };
  const totalDiags = chartData.high + chartData.medium + chartData.low || 1;

  const parcellesToShow = parcellesExpanded ? parcelles : parcelles.slice(0, 1);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* HEADER WITH BELL ICON */}
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Vue d'ensemble</Text>
        <Pressable 
          style={styles.bellIconContainer} 
          onPress={() => { setAlertsModalOpen(true); setAlertsRead(true); }}
        >
          <Ionicons 
            name="notifications" 
            size={28} 
            color={climateAlerts.length > 0 && !alertsRead ? '#c93c1f' : '#8a9a8b'} 
          />
          {climateAlerts.length > 0 && !alertsRead && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{climateAlerts.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Secteurs" value={parcelles.length} onPress={onNavigateToMap} />
        <StatCard label="Troupeaux" value={betail.length} onPress={() => {}} />
      </View>
      
      {/* Santé de l'exploitation (Diagramme) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Santé de l'exploitation</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Élevé</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { width: `${(chartData.high / totalDiags) * 100}%`, backgroundColor: '#9f2f1f' }]} />
            </View>
            <Text style={styles.chartValue}>{chartData.high}</Text>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Moyen</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { width: `${(chartData.medium / totalDiags) * 100}%`, backgroundColor: '#c96c2d' }]} />
            </View>
            <Text style={styles.chartValue}>{chartData.medium}</Text>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Faible</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { width: `${(chartData.low / totalDiags) * 100}%`, backgroundColor: '#53815a' }]} />
            </View>
            <Text style={styles.chartValue}>{chartData.low}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.sectionHeader} onPress={() => setParcellesExpanded(!parcellesExpanded)}>
          <Text style={styles.sectionTitle}>Mon exploitation</Text>
          <View style={styles.expandAction}>
            <Text style={styles.inlineAction}>{parcellesExpanded ? 'Réduire' : 'Déplier'}</Text>
            <Ionicons name={parcellesExpanded ? "chevron-up" : "chevron-down"} size={20} color="#21543d" />
          </View>
        </Pressable>
        {parcellesToShow.map((parcelle) => (
          <View key={parcelle.id} style={styles.parcelleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.parcelleTitle}>{parcelle.name}</Text>
              <Text style={styles.parcelleMeta}>{parcelle.culture || 'Aucune culture'}</Text>
            </View>
            <Text style={styles.parcelleArea}>{parcelle.surface_ha} ha</Text>
          </View>
        ))}
        {!parcellesExpanded && parcelles.length > 1 && (
          <Pressable onPress={() => setParcellesExpanded(true)}>
             <Text style={styles.parcelleCountHint}>+ {parcelles.length - 1} autres (Déplier pour voir)</Text>
          </Pressable>
        )}
      </View>

      {/* MON BÉTAIL */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mon bétail</Text>
          <Ionicons name="paw" size={24} color="#21543d" />
        </View>
        <Text style={{ color: '#677267', fontSize: 13, marginBottom: 10 }}>Suivi par puces électroniques RFID</Text>
        {betail.length === 0 && <Text style={{ color: '#8a9a8b', fontStyle: 'italic' }}>Aucun bétail enregistré.</Text>}
        {betail.map((herd) => (
          <View key={herd.id} style={styles.parcelleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.parcelleTitle}>{herd.type}</Text>
              <Text style={styles.parcelleMeta}>Race: {herd.race}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.parcelleArea}>{herd.count} têtes</Text>
              <Text style={{ fontSize: 11, color: '#53815a', fontWeight: 'bold' }}>{herd.chips} pucés</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ACTUALITÉ RÉGLEMENTAIRE */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actualité Réglementaire</Text>
        </View>
        <View style={{ gap: 12, marginTop: 10 }}>
          {news.map(item => (
            <View key={item.id} style={styles.newsItem}>
              <View style={styles.newsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
                  {item.isAI && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>✨ IA</Text>
                    </View>
                  )}
                  <Text style={styles.newsTitle} numberOfLines={1}>{item.title}</Text>
                </View>
                <Text style={styles.newsDate}>{item.date}</Text>
              </View>
              <Text style={styles.newsDesc}>{item.desc}</Text>
              {item.url && (
                <Pressable onPress={() => Linking.openURL(item.url)} style={{ marginTop: 6 }}>
                  <Text style={styles.newsLink}>🔗 Vérifier la source</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* MODAL DES ALERTES */}
      <Modal visible={alertsModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vos Alertes</Text>
              <Pressable onPress={() => setAlertsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#1d2a1e" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
              {climateAlerts.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#8a9a8b', marginTop: 20 }}>Aucune alerte pour le moment.</Text>
              ) : (
                <>
                  {/* Fire Alerts */}
                  {climateAlerts.filter(a => a.type.startsWith('incendie')).length > 0 && (
                    <View style={styles.fireAlertContainer}>
                      <View style={styles.fireAlertHeader}>
                        <Text style={styles.fireAlertTitle}>🔥 Vulnérabilité Incendie</Text>
                      </View>
                      {climateAlerts.filter(a => a.type.startsWith('incendie')).map((a, i) => (
                        <View key={`fire-${i}`} style={styles.fireAlertItem}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={styles.fireParcelle}>{a.parcelleName}</Text>
                            <Text style={styles.fireMessage}>{a.message}</Text>
                            <Text style={styles.confidenceLow}>Confiance IA : {a.score}%</Text>
                          </View>
                          <RiskBadge value={a.type === 'incendie_critique' ? 'Critique' : 'Élevé'} />
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Fugue Alerts */}
                  {climateAlerts.filter(a => a.type === 'fugue').map((a, i) => (
                    <View key={`fugue-${i}`} style={[styles.climateAlertItem, { borderColor: '#c93c1f', borderWidth: 1, backgroundColor: '#fbe9e7' }]}>
                      <Text style={[styles.climateAlertTitle, { color: '#c93c1f' }]}>🐄 {a.title}</Text>
                      <Text style={styles.climateAlertMessage}>{a.message}</Text>
                    </View>
                  ))}

                  {/* Climate Alerts */}
                  {climateAlerts.filter(a => !a.type.startsWith('incendie') && a.type !== 'fugue').map((a, i) => (
                    <View key={`clim-${i}`} style={styles.climateAlertItem}>
                      <Text style={styles.climateAlertTitle}>{a.type === 'gel' ? '❄️' : '☀️'} {a.parcelleName}</Text>
                      <Text style={styles.climateAlertMessage}>{a.title} - {a.message}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  statsRow: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: '#fffdf8', borderRadius: 22, padding: 18, gap: 14, borderWidth: 1, borderColor: '#e0d8c7' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1d2a1e', fontSize: 20, fontWeight: '800' },
  expandAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineAction: { color: '#21543d', fontWeight: '700', fontSize: 16 },
  parcelleRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee7d8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  parcelleTitle: { color: '#1d2a1e', fontSize: 16, fontWeight: '700' },
  parcelleMeta: { color: '#677267', marginTop: 4, fontSize: 14 },
  parcelleArea: { color: '#21543d', fontWeight: '800', fontSize: 16 },
  climateAlertItem: { backgroundColor: '#fffaf5', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: '#eee7d8' },
  climateAlertTitle: { fontWeight: '800', fontSize: 15, marginBottom: 4 },
  climateAlertMessage: { color: '#1d2a1e', fontSize: 14 },
  fireAlertContainer: { marginBottom: 15, backgroundColor: '#fef3f2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#fad4cd' },
  fireAlertHeader: { borderBottomWidth: 1, borderBottomColor: '#fad4cd', paddingBottom: 8, marginBottom: 8 },
  fireAlertTitle: { color: '#c93c1f', fontSize: 16, fontWeight: '800' },
  fireAlertItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  fireParcelle: { color: '#1d2a1e', fontWeight: '700', fontSize: 15 },
  fireMessage: { color: '#374238', fontSize: 14, lineHeight: 20 },
  confidenceLow: { color: '#c96c2d', fontSize: 13, fontWeight: '600' },
  disclaimerBox: { flexDirection: 'row', backgroundColor: '#fffdf8', padding: 10, borderRadius: 8, alignItems: 'flex-start', gap: 8, marginTop: 4 },
  disclaimerText: { flex: 1, color: '#c93c1f', fontSize: 12, fontStyle: 'italic', lineHeight: 16 },
  disclaimerLink: { marginTop: 10, alignSelf: 'center' },
  disclaimerLinkText: { color: '#2b5f8c', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  parcelleCountHint: { color: '#677267', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 4, paddingVertical: 8 },
  chartContainer: { gap: 12, marginTop: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chartLabel: { width: 45, color: '#677267', fontWeight: '700', fontSize: 13 },
  chartTrack: { flex: 1, height: 12, backgroundColor: '#f0ebd8', borderRadius: 6, overflow: 'hidden' },
  chartFill: { height: '100%', borderRadius: 6 },
  chartValue: { width: 25, textAlign: 'right', color: '#1d2a1e', fontWeight: '800', fontSize: 14 },
  newsItem: { borderBottomWidth: 1, borderBottomColor: '#eee7d8', paddingBottom: 10 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsTitle: { color: '#1d2a1e', fontWeight: '700', fontSize: 15, flex: 1 },
  newsDate: { color: '#8a9a8b', fontSize: 12, fontWeight: '600', marginLeft: 8 },
  newsDesc: { color: '#677267', fontSize: 14, marginTop: 4 },
  newsLink: { color: '#2b5f8c', fontSize: 13, fontWeight: '600' },
  aiBadge: { backgroundColor: '#d4af37', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  aiBadgeText: { color: '#fffdf8', fontSize: 10, fontWeight: '800' },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dashboardTitle: { fontSize: 24, fontWeight: '800', color: '#1d2a1e' },
  bellIconContainer: { position: 'relative', padding: 8 },
  bellBadge: { position: 'absolute', top: 4, right: 6, backgroundColor: '#c93c1f', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fffdf8', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0d8c7' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1d2a1e' }
});
