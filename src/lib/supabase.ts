import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hlmpahpwqisotxolkjnb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L4eyPJqv0pd2SZVf2-GIQQ_x-3ghqDt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
