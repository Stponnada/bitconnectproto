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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);

        if (currentUser) {
          // --- START: MODIFIED CODE ---
          // This logic fixes the race condition where the profile might not be
          // available immediately after a user signs up.
          let attempts = 0;
          let profileData = null;

          while (attempts < 3 && !profileData) {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();

            if (data) {
              profileData = data;
            } else {
              attempts++;
              if (attempts < 3) {
                console.warn(`Profile not found for user ${currentUser.id}, attempt ${attempts}. Retrying in 500ms...`);
                await new Promise(res => setTimeout(res, 500));
              } else {
                console.error("Failed to fetch profile after multiple attempts.", error);
              }
            }
          }
          setProfile(profileData as Profile | null);
          // --- END: MODIFIED CODE ---
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );
    
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (!session) {
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