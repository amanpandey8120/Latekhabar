import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url !== 'https://placeholder.supabase.co' &&
    key !== 'placeholder-anon-key'
  );
};
