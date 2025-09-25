import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileComplete: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getActiveSession = async () => {
      const { data: { session: activeSession }, error } = await supabase.auth.getSession();
      
      if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
      }
      
      setSession(activeSession);
      const currentUser = activeSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        setProfile(userProfile ?? null);
        setProfileComplete(userProfile?.profile_complete ?? false);
      }
      setLoading(false);
    };
    
    getActiveSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          setProfile(userProfile ?? null);
          setProfileComplete(userProfile?.profile_complete ?? false);
        } else {
          setProfile(null);
          setProfileComplete(null);
        }
        // Small delay to prevent flashing content
        if (_event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    profileComplete,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};