import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fqzttthaphxabykkigpx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2mtgwlMCGn_-lxt63kR1BQ_cjPmK4t_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
