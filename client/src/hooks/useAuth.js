import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { clearAttendanceContext } from '../utils/attendanceContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session from backend cookie
  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.me();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    return authService.register(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAttendanceContext();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.me();
      setUser(res.user);
      return res.user;
    } catch {
      setUser(null);
      return null;
    }
  };

  const value = {
    user,
    loading,
    authenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
