import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.status === 429) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
        } else if (error.status === 422) {
          if (error.message.includes('password')) {
            throw new Error('Password is too weak. Please follow the password requirements.');
          } else if (error.message.includes('email')) {
            throw new Error('Please enter a valid email address.');
          }
          throw new Error('Please check your input and try again.');
        } else if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw error;
      }
    } catch (error: any) {
      const message = error.message || 'Failed to create account. Please try again.';
      throw new Error(message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.status === 429) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        } else if (error.status === 422) {
          throw new Error('Please check your email and password format.');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password.');
        }
        throw error;
      }

      // Immediately update the user state after successful sign in
      setUser(data.user);
      setLoading(false);
    } catch (error: any) {
      const message = error.message || 'Failed to sign in. Please try again.';
      throw new Error(message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      const message = error.message || 'Failed to sign out. Please try again.';
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 