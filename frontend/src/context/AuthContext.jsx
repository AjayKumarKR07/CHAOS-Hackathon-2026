import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();

    const handleSessionExpired = () => {
      authService.logout();
      setUser(null);
    };
    window.addEventListener('jarvis:session-expired', handleSessionExpired);
    return () => window.removeEventListener('jarvis:session-expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (fullName, email, password, confirmPassword) => {
    const data = await authService.register(fullName, email, password, confirmPassword);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
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
