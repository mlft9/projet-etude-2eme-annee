/**
 * Analyse les prévisions météo sur 7 jours et retourne les alertes climatiques.
 * Seuils par défaut : Gel < 0°C, Canicule > 35°C
 *
 * @param {Object} weatherData - Données retournées par fetchIrrigationForecast
 * @returns {Array} Liste des alertes (ex: [{ type: 'gel', message: 'Gel prévu dans 2 jours (-2°C)' }])
 */
export function analyzeClimateRisk(weatherData) {
  const alerts = [];
  if (!weatherData || !weatherData.temperature_2m_min || !weatherData.temperature_2m_max) {
    return alerts;
  }

  // Vérifier sur les 7 prochains jours
  for (let i = 0; i < weatherData.time.length; i++) {
    const minTemp = weatherData.temperature_2m_min[i];
    const maxTemp = weatherData.temperature_2m_max[i];
    
    // Le jour 0 est aujourd'hui, jour 1 est demain, etc.
    let dayLabel = "aujourd'hui";
    if (i === 1) dayLabel = 'demain';
    else if (i > 1) dayLabel = `dans ${i} jours`;

    if (minTemp <= 0) {
      alerts.push({
        type: 'gel',
        title: 'Alerte Gel',
        message: `Gel prévu ${dayLabel} (${minTemp.toFixed(1)}°C)`,
        color: '#1d6fe5' // Bleu
      });
      // On ne remonte que la première alerte de ce type pour ne pas spammer
      break; 
    }
  }

  for (let i = 0; i < weatherData.time.length; i++) {
    const maxTemp = weatherData.temperature_2m_max[i];
    let dayLabel = "aujourd'hui";
    if (i === 1) dayLabel = 'demain';
    else if (i > 1) dayLabel = `dans ${i} jours`;

    if (maxTemp >= 35) {
      alerts.push({
        type: 'canicule',
        title: 'Alerte Canicule',
        message: `Canicule prévue ${dayLabel} (${maxTemp.toFixed(1)}°C)`,
        color: '#9f2f1f' // Rouge
      });
      break;
    }
  }

  return alerts;
}

/**
 * Calcule un risque d'incendie affiné
 * Utilise la température, les précipitations, le vent et l'humidité de l'air.
 * (Approximation du Fire Weather Index).
 */
export function analyzeFireRisk(weatherData, soilHumidity = null) {
  const alerts = [];
  if (!weatherData || !weatherData.temperature_2m_max || !weatherData.precipitation_sum) {
    return alerts;
  }

  // Vérifier sur les 7 prochains jours
  for (let i = 0; i < weatherData.time.length; i++) {
    const maxTemp = weatherData.temperature_2m_max[i];
    const rain = weatherData.precipitation_sum[i];
    const wind = weatherData.windspeed_10m_max ? weatherData.windspeed_10m_max[i] : 0;
    const airHum = weatherData.relative_humidity_2m_min ? weatherData.relative_humidity_2m_min[i] : 50;
    
    let dayLabel = "aujourd'hui";
    if (i === 1) dayLabel = 'demain';
    else if (i > 1) dayLabel = `dans ${i} jours`;

    // Algorithme simplifié inspiré du FWI
    let riskScore = 0;
    
    if (maxTemp > 25) riskScore += 1;
    if (maxTemp > 30) riskScore += 1;
    if (maxTemp > 35) riskScore += 2;
    
    if (rain < 1) riskScore += 1;
    if (rain < 0.1) riskScore += 1;
    
    if (airHum < 30) riskScore += 2;
    else if (airHum < 40) riskScore += 1;

    if (wind > 30) riskScore += 2; // vent fort
    else if (wind > 15) riskScore += 1;

    // Si on a un capteur de sol et qu'il est très sec (<20%)
    if (soilHumidity !== null && soilHumidity < 20) {
      riskScore += 2;
    }

    const scorePct = Math.min(100, riskScore * 10);

    if (riskScore >= 7) {
      alerts.push({
        type: 'incendie_critique',
        title: 'Risque Incendie Extrême',
        message: `Conditions extrêmes ${dayLabel} (Vent, Chaleur, Sécheresse). Suivez les consignes préfectorales !`,
        color: '#c93c1f', // Rouge très foncé
        score: scorePct,
      });
      break;
    } else if (riskScore >= 5) {
      alerts.push({
        type: 'incendie_eleve',
        title: 'Risque Incendie Élevé',
        message: `Risque élevé ${dayLabel} (${maxTemp.toFixed(1)}°C, vent ${wind.toFixed(0)}km/h). Soyez vigilant.`,
        color: '#c96c2d', // Orange
        score: scorePct,
      });
      break;
    }
  }

  return alerts;
}
