import type { NextConfig } from "next";

const DEFAULT_URL = 'https://kcncdxjflyhbhzdyclrb.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbmNkeGpmbHloYmh6ZHljbHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NzkzMzgsImV4cCI6MjEwNDU1NTMzOH0.ZuGjXfE0-DfDjMQyFPkaZVoatyoGahJux82bYtzzLRY';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      DEFAULT_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      DEFAULT_ANON_KEY,
    NEXT_PUBLIC_STORAGE_TYPE:
      process.env.NEXT_PUBLIC_STORAGE_TYPE ||
      process.env.STORAGE_TYPE ||
      'supabase',
  },
};

export default nextConfig;
