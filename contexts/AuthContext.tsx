// src/contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This listener is the single source of truth for auth state.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // --- THIS IS THE CRUCIAL FIX ---
        // We set loading to TRUE here to prevent any redirects until we have all the data.
        setIsLoading(true);

        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);

        if (currentUser) {
          // If a user is logged in, fetch their profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          setProfile(profileData as Profile | null);
        } else {
          // If no user, clear the profile
          setProfile(null);
        }
        
        // Only set loading to FALSE after we have both the user and their profile (or know it's null).
        setIsLoading(false);
      }
    );

    // Initial check on mount.
    // We get the session and the onAuthStateChange listener will fire, handling the initial state.
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
             // If there's no session on initial load, we're not loading anymore.
             setIsLoading(false);
        }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, profile, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};