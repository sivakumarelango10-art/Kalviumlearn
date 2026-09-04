import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fqzttthaphxabykkigpx.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_2mtgwlMCGn_-lxt63kR1BQ_cjPmK4t_';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
