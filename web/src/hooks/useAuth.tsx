import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthCtx = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wbat_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('wbat_token', data.access_token);
    localStorage.setItem('wbat_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('wbat_token');
    localStorage.removeItem('wbat_user');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
