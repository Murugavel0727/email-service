import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // We're not using auth yet
    },
});

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseKey &&
        supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' &&
        supabaseKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';
};
