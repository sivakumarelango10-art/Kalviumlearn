import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://fqzttthaphxabykkigpx.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_2mtgwlMCGn_-lxt63kR1BQ_cjPmK4t_";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
