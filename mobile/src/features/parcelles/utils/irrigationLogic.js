import { PLANTS_DATA } from '../../../shared/data/plantsData';

/**
 * Calcule le niveau de risque de stress hydrique
 * @param {Object} params
 * @param {number} params.soilHumidity - Humidité actuelle (%)
 * @param {number} params.forecastPrecip - Précipitations prévues (mm) sur 7 jours
 * @param {number} [params.recentPrecip] - Précipitations récentes (mm) saisies manuellement
 * @param {string} params.cultureName - Nom de la culture
 * @returns {string} 'Faible', 'Modéré', ou 'Élevé'
 */
export function calculateWaterStressRisk({ soilHumidity, forecastPrecip, recentPrecip, cultureName }) {
  let effectiveHumidity = soilHumidity;

  // Si pas de capteur d'humidité mais qu'on a une saisie manuelle récente
  if (effectiveHumidity === undefined || effectiveHumidity === null) {
    if (recentPrecip !== undefined && recentPrecip !== null) {
      // Estimation arbitraire : 1mm de pluie ~ +2% d'humidité du sol
      effectiveHumidity = Math.min(100, (recentPrecip * 2) + 20); // Base 20%
    } else {
      return 'Inconnu';
    }
  }

  // Logique simplifiée
  let risk = 'Modéré';

  if (effectiveHumidity < 35 && forecastPrecip < 5) {
    risk = 'Élevé';
  } else if (effectiveHumidity > 60 || forecastPrecip > 20) {
    risk = 'Faible';
  } else if (effectiveHumidity < 45 && forecastPrecip < 10) {
    risk = 'Modéré';
  }

  // Ajustement basique selon la culture
  if (cultureName) {
    const plantData = PLANTS_DATA[cultureName];
    if (plantData && plantData.needs && plantData.needs.water) {
      const needs = plantData.needs.water.toLowerCase();
      // Si la plante a des besoins élevés en eau, on augmente la sévérité plus vite
      if (needs.includes('élevés') || needs.includes('fort')) {
        if (risk === 'Modéré' && effectiveHumidity < 50) {
          risk = 'Élevé';
        }
      }
    }
  }

  return risk;
}
