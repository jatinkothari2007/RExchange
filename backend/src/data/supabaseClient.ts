import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://bsgotjhpbvrsswhujwsp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_dLRa7HNsF7GipmkW1eaPXg_5MAiDBPP';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseKey &&
  supabaseKey !== 'your-supabase-service-role-key'
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log(`[SUPABASE DATA LAYER] Connected to project: ${supabaseUrl}`);
