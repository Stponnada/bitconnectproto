// src/contexts/AuthContext.tsx (Upgraded Version)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types'; // Make sure your Profile type is imported

// Define the shape of the context's value
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // <-- ADDED PROFILE TO THE CONTEXT
  loading: boolean;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // <-- State for the profile
  const [loading, setLoading] = useState(true);

  // This useEffect will run when the session changes (on login/logout)
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // If there's a user, fetch their profile data
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Also fetch the profile on auth changes
      if (session?.user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
        setProfile(profileData);
      } else {
        setProfile(null); // Clear profile on logout
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, profile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};