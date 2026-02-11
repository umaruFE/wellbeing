import { createClient } from '@supabase/supabase-js';

// Supabase client for frontend
// These environment variables should be set in your .env file
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

