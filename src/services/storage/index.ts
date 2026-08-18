import { IStorageService } from './types';
import { localStorageService } from './localStorageService';
import { supabaseStorageService } from './supabaseService';

export function getStorageService(): IStorageService {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE;
  if (storageType === 'supabase') {
    return supabaseStorageService;
  }
  return localStorageService;
}

export const storage = getStorageService();
export * from './types';
export * from './localStorageService';
export * from './supabaseService';
