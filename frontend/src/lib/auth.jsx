import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!localStorage.getItem('cc_token'));

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('cc-logout', logout);
    return () => window.removeEventListener('cc-logout', logout);
  }, [logout]);

  useEffect(() => {
    if (!localStorage.getItem('cc_token')) return;
    api.get('/users/profile').then((r) => setUser(r.data)).catch(() => logout()).finally(() => setReady(true));
  }, [logout]);

  const accept = (data) => {
    localStorage.setItem('cc_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(() => ({
    user, ready, logout, setUser,
    /** One form for everyone: the coordinator username routes to the admin portal, anything else is a student. */
    login: async (username, password) => accept((await api.post('/auth/login', { username, password })).data),
    register: async (payload) => accept((await api.post('/auth/register', payload)).data),
  }), [user, ready, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const isAdmin = (u) => u?.role === 'ADMIN';
export const roleLabel = (u) => (u?.role === 'ADMIN' ? 'Club coordinator' : 'Student');
export const homeFor = (u) => (!u ? '/' : u.role === 'ADMIN' ? '/admin' : u.profileComplete ? '/events' : '/welcome');
