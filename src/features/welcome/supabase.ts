import { createClient } from '@supabase/supabase-js';

// These are the exact credentials from the original Welcome app
const SUPABASE_URL = 'https://tamdojsjtibtqjknkpuy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbWRvanNqdGlidHFqa25rcHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzQ5MjIsImV4cCI6MjA4OTk1MDkyMn0.e025-g5elNaEjUIhLkg-qfc54s_S-Ng2YkcMIKZlwiA';

export const welcomeSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'welcome-supabase-auth',
    detectSessionInUrl: false,
  },
});

