import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { login as apiLogin } from '../../../shared/services/api';

const SESSION_KEY = 'parcellia.session';

export function useAuth() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          setToken(session.token || '');
          setUser(session.user || null);
        }
      } catch {
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setBooting(false);
      }
    }
    restoreSession();
  }, []);

  async function persistSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  }

  async function clearSession() {
    setToken('');
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  async function handleLogin(credentials) {
    setAuthLoading(true);
    try {
      const session = await apiLogin(credentials);
      await persistSession(session.token, session.user);
    } finally {
      setAuthLoading(false);
    }
  }

  return { booting, token, user, authLoading, handleLogin, clearSession };
}
