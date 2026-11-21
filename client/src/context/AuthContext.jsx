import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the extra profile info (username, phone, avatar_url) from the profiles table
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (typeof supabase.auth.getUser === 'function') {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          setUser(data.user);
          if (data.user.email_confirmed_at) {
            await fetchProfile(data.user.id);
          }
          return data.user;
        }
      }
      const { data: { session } = {} } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser?.email_confirmed_at) {
        await fetchProfile(sessionUser.id);
      }
      return sessionUser;
    } catch (err) {
      console.warn('Could not refresh auth user:', err);
      return null;
    }
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // Get current session on mount
    supabase.auth.getSession()
      .then(({ data: { session } = {} }) => {
        if (!isMounted) return;
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser?.email_confirmed_at) {
          fetchProfile(sessionUser.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Session check failed:', err);
        if (isMounted) setLoading(false);
      });

    // Listen for auth state changes (login, logout, email confirmed, etc.)
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser?.email_confirmed_at) {
          await fetchProfile(sessionUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    ) || {};

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAuthenticated = Boolean(user && user.email_confirmed_at);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    refreshUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
