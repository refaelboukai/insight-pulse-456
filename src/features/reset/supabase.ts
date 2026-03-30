import { createClient } from '@supabase/supabase-js';

// These are the exact credentials from the original Reset app
const SUPABASE_URL = 'https://tkohrbevhtlatnzxokfi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrb2hyYmV2aHRsYXRuenhva2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODY1NzcsImV4cCI6MjA4OTE2MjU3N30.xp4JdZ8DfLXEqcFD-nBq_IQCRQAf-Yi8TLMGCEDLY7g';

export const resetSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'reset-supabase-auth',
    detectSessionInUrl: false,
  },
});

