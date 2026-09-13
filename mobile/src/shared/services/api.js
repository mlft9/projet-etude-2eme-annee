import { API_BASE_URL } from '../../config';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...jsonHeaders, ...(options.headers || {}) },
  });

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

  if (!response.ok) throw new Error(data?.error || 'Requete impossible');
  return data;
}

export function login(credentials) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}

export function register(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchParcelles(token) {
  // DEMO MODE: Hardcoded rich dataset
  return Promise.resolve([
    { id: 1, name: 'Champ Nord (Blé)', culture: 'Blé d\'hiver', surface_ha: 15, latitude: 43.60, longitude: 1.44 },
    { id: 2, name: 'Vigne Sud', culture: 'Vigne', surface_ha: 5.5, latitude: 43.58, longitude: 1.45 },
    { id: 3, name: 'Parcelle Maïs', culture: 'Maïs doux', surface_ha: 12, latitude: 43.62, longitude: 1.42 }
  ]);
}

export function createParcelle(token, payload) {
  return request('/parcelles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateParcelle(token, id, payload) {
  return request(`/parcelles/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteParcelle(token, id) {
  return request(`/parcelles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchDiagnostics(token) {
  // DEMO MODE: Hardcoded rich dataset
  return Promise.resolve([
    { id: 101, parcelle_id: 1, resultat: 'Rouille jaune', score_confiance: 85, niveau_risque: 'Élevé', created_at: new Date().toISOString() },
    { id: 102, parcelle_id: 2, resultat: 'Mildiou (début)', score_confiance: 65, niveau_risque: 'Moyen', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 103, parcelle_id: 3, resultat: 'Sain', score_confiance: 95, niveau_risque: 'Aucun', created_at: new Date(Date.now() - 172800000).toISOString() }
  ]);
}

export function createDiagnostic(token, payload) {
  return request('/diagnostics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function refineDiagnostic(token, diagnosticId, capteurData) {
  return request(`/diagnostics/${diagnosticId}/affiner`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(capteurData),
  });
}

export function fetchLatestCapteurs(token, parcelleId) {
  return request(`/parcelles/${parcelleId}/capteurs/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function askPlantAssistant(token, payload) {
  return request('/diagnostics/plantes/assistant', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function alertFarmers(token, diagnosticId, payload) {
  return request(`/diagnostics/${diagnosticId}/alert`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function fetchCapteursForParcelle(token, parcelleId) {
  return request(`/parcelles/${parcelleId}/capteurs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchSoilHealth(token, parcelleId) {
  try {
    const data = await request(`/parcelles/${parcelleId}/soil-health`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    // Fallback fictif si le backend n'est pas à jour
    return {
      ph: (Math.random() * (7.5 - 5.5) + 5.5).toFixed(1),
      mo: (Math.random() * (4 - 1.5) + 1.5).toFixed(1),
      azote: Math.floor(Math.random() * (120 - 40) + 40)
    };
  }
}

export function fetchCapteurs(token) {
  // DEMO MODE: Hardcoded rich dataset
  return Promise.resolve([
    { id: 'c1', name: 'Sonde Temp/Hum - Blé', serial_number: 'SN-001', parcelle_id: 1, latest: { temp: 18, humidite: 45 } },
    { id: 'c2', name: 'Station Vigne', serial_number: 'SN-002', parcelle_id: 2, latest: { temp: 22, humidite: 60 } },
    { id: 'c3', name: 'Sonde Maïs (Irrigation)', serial_number: 'SN-003', parcelle_id: 3, latest: { temp: 25, humidite: 30 } }
  ]);
}

export function createCapteur(token, payload) {
  return request('/capteurs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteCapteur(token, id) {
  return request(`/capteurs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function associateCapteur(token, capteurId, parcelleId) {
  return request(`/capteurs/${capteurId}/parcelle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ parcelle_id: parcelleId }),
  });
}

// SIMULATION: Dataset B�tail
export async function fetchBetail(token) {
  return Promise.resolve([
    { id: 'b1', type: 'Bovins (Laitiers)', race: 'Prim''Holstein', count: 45, chips: 45, localisation: 'P�turage Nord', coords: { lat: 43.6, lng: 1.4 } },
    { id: 'b2', type: 'Bovins (Viande)', race: 'Charolaise', count: 20, chips: 20, localisation: '�table Principale', coords: { lat: 43.61, lng: 1.41 } },
    { id: 'b3', type: 'Ovins', race: 'Lacaune', count: 120, chips: 30, localisation: 'Colline Est', coords: { lat: 43.59, lng: 1.42 } }
  ]);
}
