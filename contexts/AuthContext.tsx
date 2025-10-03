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
    let isMounted = true;

    // --- START OF THE FIX ---
    // This function handles the very first load of the application.
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (currentUser) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
              setProfile(profileData as Profile | null);
            }
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        // This is the most important part: GUARANTEE that loading is set to false.
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();
    // --- END OF THE FIX ---

    // Set up a listener for real-time auth changes (e.g., login, logout).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted) {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if(currentUser) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .single();
                setProfile(profileData as Profile | null);
            } else {
                setProfile(null);
            }
        }
      }
    );

    return () => {
      isMounted = false;
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