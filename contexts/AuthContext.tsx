// src/contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      if (error) console.error("Error refreshing profile:", error);
      setProfile(profileData as Profile | null);
      console.log('Profile refreshed in context.');
    }
  }, []);

  useEffect(() => {
    // This handles the initial session load and any subsequent auth changes.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // --- START OF THE FIX ---
        // We wrap the entire logic in a try/finally block. This ensures that
        // setIsLoading(false) is ALWAYS called, preventing the app from getting
        // stuck on a loading screen if the profile fetch fails on reload.
        try {
          setIsLoading(true);
          const currentUser = session?.user ?? null;
          setSession(session);
          setUser(currentUser);

          if (currentUser) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();
            setProfile(profileData as Profile | null);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error in onAuthStateChange handler:", error);
          setProfile(null); // Reset profile on error
        } finally {
          setIsLoading(false);
        }
        // --- END OF THE FIX ---
      }
    );

    // Initial check in case onAuthStateChange doesn't fire immediately.
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (!session) {
             setIsLoading(false);
        }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, profile, isLoading, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};