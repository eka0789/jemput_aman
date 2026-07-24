import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const apiKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && apiKey);

export const supabase = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, apiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;

export const assertSupabaseConfigured = () => {
  if (!supabase) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SECRET_KEY pada environment backend.'
    );
  }
  return supabase;
};

export const unwrapSupabase = ({ data, error }, operation) => {
  if (error) {
    const wrappedError = new Error(`Supabase ${operation} gagal: ${error.message}`);
    wrappedError.code = error.code;
    wrappedError.details = error.details;
    wrappedError.statusCode = 503;
    throw wrappedError;
  }
  return data;
};
