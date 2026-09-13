/**
 * Moteur d'audit et de conseil financier pour l'IA Parcell-IA
 */

export function analyzeFinancialHealth(transactions = []) {
  let auditReports = [];
  
  if (!transactions || transactions.length === 0) {
    return ["Aucune transaction enregistrée. Pensez à utiliser l'onglet Gestion pour suivre votre trésorerie."];
  }

  const totalRevenus = transactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0);
  const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0);
  const solde = totalRevenus - totalDepenses;

  // 1. Audit de la Rentabilité Globale (Taux d'endettement / de charge)
  if (totalRevenus > 0) {
    const ratioCharges = (totalDepenses / totalRevenus) * 100;
    if (ratioCharges > 85) {
      auditReports.push(
        `📉 Ratio de charges critique : Vos dépenses représentent ${ratioCharges.toFixed(0)}% de vos revenus. Il est recommandé de geler les investissements non essentiels jusqu'à la prochaine rentrée d'argent.`
      );
    } else if (ratioCharges < 50) {
      auditReports.push(
        `📈 Forte rentabilité : Vos charges ne représentent que ${ratioCharges.toFixed(0)}% de vos revenus. C'est le moment idéal pour constituer une épargne de précaution ou investir dans de nouveaux capteurs météo.`
      );
    } else {
      auditReports.push(
        `⚖️ Bilan équilibré : Vos finances sont stables avec un ratio de charges de ${ratioCharges.toFixed(0)}%.`
      );
    }
  } else if (totalDepenses > 0 && totalRevenus === 0) {
    auditReports.push(
      "⚠️ Cash-flow négatif absolu : Vous avez accumulé des dépenses sans aucun revenu déclaré. Assurez-vous d'avoir une trésorerie (fonds de roulement) suffisante ou rapprochez-vous de votre banque pour un découvert autorisé (ex: prêts de campagne)."
    );
  }

  // 2. Détection du plus gros poste de dépense
  const depensesList = transactions.filter(t => t.type === 'depense');
  if (depensesList.length > 0) {
    // Trouver la plus grosse dépense
    const biggestExpense = depensesList.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
    
    // Si la plus grosse dépense représente plus de 40% des dépenses totales
    if (biggestExpense.amount > (totalDepenses * 0.4) && depensesList.length > 1) {
      auditReports.push(
        `🔍 Point de vigilance : La transaction "${biggestExpense.label}" (${biggestExpense.amount}€) représente à elle seule une part massive de vos dépenses totales. Pensez à lisser ce type d'achat sur plusieurs mois ou à demander des subventions d'investissement (ex: subventions PCAE).`
      );
    }
  }

  return auditReports;
}
