import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (name: string, phone: string, role: 'customer' | 'owner', extra?: { businessName?: string; licenseUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (updated: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = '@salon_auth_user';

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((data) => {
      if (data) setUser(JSON.parse(data));
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (
    name: string,
    phone: string,
    role: 'customer' | 'owner',
    extra?: { businessName?: string; licenseUrl?: string },
  ) => {
    const base = getApiBase();
    const response = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, role, ...extra }),
    });
    if (!response.ok) throw new Error('Login failed');
    const userData: User = await response.json();
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (updated: User) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
