import { createClient } from '@supabase/supabase-js';

/**
 * NOTE: We use explicit type casts in the service layer (src/types/database.ts)
 * rather than the Supabase-generated Database generic. If you generate a typed
 * schema via `supabase gen types typescript`, add it back as:
 *   import type { Database } from './types/database';
 *   export const supabase = createClient<Database>(url, key);
 *
 * KEY PRIORITY: VITE_SUPABASE_ANON_KEY (JWT eyJ...) is used first because
 * it carries the correct JWT claims required for RLS auth.uid() resolution on
 * all authenticated DB write operations. VITE_SUPABASE_PUBLISHABLE_KEY
 * (sb_publishable_*) is a Supabase v2 API key with potentially scoped
 * permissions and is used only as a fallback if the anon key is absent.
 */

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url &&
      key &&
      url !== 'https://placeholder.supabase.co' &&
      key !== 'placeholder-anon-key'
  );
};
