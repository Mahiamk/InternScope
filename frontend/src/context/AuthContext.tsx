import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, StudentProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  profileLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const prof = await api.profile.get();
      setProfile(prof);
      return prof;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('internscope_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const u = await api.auth.me();
      setUser(u);
      await fetchProfile();
    } catch {
      localStorage.removeItem('internscope_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('internscope_token', res.access_token);
    setUser(res.user);
    await fetchProfile();
    return res.user;
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    localStorage.setItem('internscope_token', res.access_token);
    setUser(res.user);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('internscope_token');
    setUser(null);
    setProfile(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (data: Partial<StudentProfile>) => {
    const updated = await api.profile.update(data);
    setProfile(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        login,
        register,
        logout,
        refreshUser,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

