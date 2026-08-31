import { IStorageService } from './types';
import { localStorageService } from './localStorageService';
import { supabaseStorageService } from './supabaseService';
import { isSupabaseConfigured } from '@/lib/supabase';

export function getStorageService(): IStorageService {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE;
  
  if (storageType === 'supabase' || (storageType !== 'localStorage' && isSupabaseConfigured())) {
    return supabaseStorageService;
  }
  return localStorageService;
}

export const storage = getStorageService();
export * from './types';
export * from './localStorageService';
export * from './supabaseService';
