import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_RESET_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_RESET_SUPABASE_KEY as string;

export const resetSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'reset-supabase-auth',
    detectSessionInUrl: false,
  },
});
