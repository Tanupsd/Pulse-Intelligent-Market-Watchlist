import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pulse_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pulse_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
          localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { user: authUser, token: authToken } = res.data;
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('pulse_token', authToken);
    localStorage.setItem('pulse_user', JSON.stringify(authUser));
    return authUser;
  };

  const register = async (email, password) => {
    const res = await authApi.register(email, password);
    const { user: authUser, token: authToken } = res.data;
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('pulse_token', authToken);
    localStorage.setItem('pulse_user', JSON.stringify(authUser));
    return authUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
