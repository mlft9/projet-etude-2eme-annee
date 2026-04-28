import Constants from 'expo-constants';

function getApiUrl() {
  // En dev avec Expo Go, hostUri = "192.168.x.x:8081" → on prend l'IP et on met le port backend
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

export const API_BASE_URL = getApiUrl();
