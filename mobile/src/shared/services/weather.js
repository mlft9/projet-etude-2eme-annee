export async function fetchIrrigationForecast(latitude, longitude) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min,windspeed_10m_max,relative_humidity_2m_min&timezone=Europe%2FParis&forecast_days=7`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo error: ${response.status}`);
    }
    const data = await response.json();
    return data.daily || null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}
