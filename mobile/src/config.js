import Constants from 'expo-constants';

function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // En Expo Go sur device physique, hostUri contient l'IP de la machine hôte (ex: "192.168.1.10:8081")
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost') {
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveApiUrl();
