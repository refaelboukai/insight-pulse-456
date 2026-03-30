import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_WELCOME_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_WELCOME_SUPABASE_KEY as string;

export const welcomeSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'welcome-supabase-auth',
  },
});
