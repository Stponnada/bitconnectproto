// src/contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Define the shape of your context data
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true, // Start in a loading state
});

// Create a provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an active session when the component mounts
    const getActiveSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false); // We're done loading
    };

    getActiveSession();

    // 2. Listen for changes in authentication state (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false); // Also done loading after a change
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};