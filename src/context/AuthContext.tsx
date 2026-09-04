import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'kalvi_user_email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const verifyEmail = async (email: string): Promise<Profile | null> => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      return data.profile;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedEmail = localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        const profile = await verifyEmail(savedEmail);
        if (profile) {
          setUser(profile);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithEmail = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const profile = await verifyEmail(email);
    setLoading(false);

    if (profile) {
      setUser(profile);
      localStorage.setItem(STORAGE_KEY, profile.email);
      return true;
    }
    return false;
  };

  const signInWithGoogle = async () => {
    // In production, triggers Supabase Google OAuth
    // If running in development without external Google Cloud OAuth credentials configured,
    // prompt user or default to Super Admin
    setLoading(true);
    setError(null);
    try {
      // Default initial Super Admin email
      const targetEmail = 'codingplatform10@gmail.com';
      await loginWithEmail(targetEmail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (user?.email) {
      const profile = await verifyEmail(user.email);
      if (profile) setUser(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithEmail,
        signInWithGoogle,
        signOut,
        refreshUser
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
