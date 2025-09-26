// src/contexts/AuthContext.tsx (Simplified and More Robust Version)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean; // This is the state causing the issue
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    // onAuthStateChange is the single source of truth.
    // It fires once on load, and again on every login/logout.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If a user is logged in, fetch their profile.
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profileData);
      } else {
        // If the user logs out, clear their profile.
        setProfile(null);
      }

      // THIS IS THE CRITICAL FIX:
      // We set loading to false AFTER the session and profile have been handled.
      // This guarantees the loading spinner will always disappear.
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, profile, loading };

  // We show a loading spinner for the entire app while the first auth check is running.
  // This prevents any weird flashes of content or redirects.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bits-red"></div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


// This is the hook that all your other components will use.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};