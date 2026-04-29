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
  return request('/parcelles', { headers: { Authorization: `Bearer ${token}` } });
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
  return request('/diagnostics', { headers: { Authorization: `Bearer ${token}` } });
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
