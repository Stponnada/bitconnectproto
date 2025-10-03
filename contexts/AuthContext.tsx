// src/contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types'; // <-- MODIFIED: Import Profile type

// --- MODIFIED: Define the new shape of the context data ---
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // Profile is now part of the context
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null, // Default value
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // State for the profile
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getActiveSessionAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      }

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // --- NEW: Fetch profile data if a user exists ---
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        setProfile(profileData as Profile | null);
      }
      
      setIsLoading(false); // We're done loading only after all initial data is fetched
    };

    getActiveSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // --- NEW: Also fetch/clear profile on auth state change ---
        if (currentUser) {
           const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          setProfile(profileData as Profile | null);
        } else {
          setProfile(null); // Clear profile on logout
        }

        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile, // <-- MODIFIED: Provide profile in the context value
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};