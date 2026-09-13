/**
 * Moteur de règles réglementaires simulé pour l'IA Parcell-IA
 */

export function analyzeRegulatoryCompliance(parcelles = [], transactions = []) {
  let complianceReports = [];
  
  const totalSurface = parcelles.reduce((acc, p) => acc + (Number(p.surface_ha) || 0), 0);
  
  // 1. Règle de la diversité des assolements (PAC)
  // En général, si SAU > 10ha, il faut au moins 2 cultures principales.
  if (totalSurface > 10) {
    const cultures = new Set(parcelles.map(p => (p.culture || 'Non définie').trim().toLowerCase()));
    // Retirer 'non définie' du comptage
    cultures.delete('non définie');
    
    if (cultures.size < 2) {
      complianceReports.push(
        "⚠️ PAC (Diversité) : Votre exploitation dépasse 10ha mais vous déclarez moins de 2 cultures différentes. Vous risquez des pénalités sur vos aides directes. Pensez à diversifier votre assolement."
      );
    } else {
      complianceReports.push(
        "✅ PAC (Diversité) : Vous respectez la condition de diversité des cultures pour votre surface de plus de 10ha."
      );
    }
  }

  // 2. Directive Nitrates (Période d'interdiction d'épandage)
  // Simulé : Interdiction générale entre le 15 novembre et le 15 janvier pour de nombreux fertilisants.
  const currentMonth = new Date().getMonth(); // 0-11
  const isRestrictedPeriod = currentMonth === 10 /* Nov */ || currentMonth === 11 /* Dec */ || currentMonth === 0 /* Jan */;
  
  if (isRestrictedPeriod) {
    // Vérifier s'il y a eu des dépenses récentes en "engrais" ou "nitrate"
    const recentFertilizer = transactions.some(t => {
      if (t.type === 'depense' && t.label) {
        const lbl = t.label.toLowerCase();
        return lbl.includes('engrais') || lbl.includes('nitrate') || lbl.includes('azote');
      }
      return false;
    });

    if (recentFertilizer) {
      complianceReports.push(
        "🚨 Directive Nitrates : J'ai détecté des achats d'engrais récents. Attention, nous sommes dans une période de restriction d'épandage (Novembre-Janvier). Vérifiez le calendrier régional avant toute application."
      );
    }
  }

  return complianceReports;
}
