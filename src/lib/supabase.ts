import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://kcncdxjflyhbhzdyclrb.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbmNkeGpmbHloYmh6ZHljbHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NzkzMzgsImV4cCI6MjEwNDU1NTMzOH0.ZuGjXfE0-DfDjMQyFPkaZVoatyoGahJux82bYtzzLRY';

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  DEFAULT_URL;

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_KEY || 
  DEFAULT_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('http') && 
    supabaseAnonKey.length > 10
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return clientInstance;
};

export const supabase = getSupabaseClient();
