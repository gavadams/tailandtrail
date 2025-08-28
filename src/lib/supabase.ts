/**
 * Supabase client configuration
 * This handles our database connection and authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin authentication helper
export const signInAdmin = async (password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@pubpuzzlecrawl.com',
    password: password
  });
  return { data, error };
};

// Sign out helper
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};