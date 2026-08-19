/**
 * Supabase Edge Function: create-user
 *
 * Secure server-side user creation for the Late Khabar admin portal.
 *
 * Flow:
 *   1. Verify the caller has a valid Supabase JWT (authenticated).
 *   2. Look up the caller's public.profiles row — must have role = 'admin'.
 *   3. Create the new auth user via the Admin Auth API (service-role key,
 *      never exposed to the browser).
 *   4. Upsert the matching public.profiles row with the requested role.
 *   5. Return the new profile or a structured error.
 *
 * The SUPABASE_SERVICE_ROLE_KEY is injected automatically by the Supabase
 * runtime as a secret — it is never in any VITE_* variable.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // ── 1. Parse request body ──────────────────────────────────────────────
    let body: {
      fullName?: string;
      email?: string;
      password?: string;
      role?: string;
      state?: string;
      city?: string;
    };

    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { fullName, email, password, role, state, city } = body;

    // ── 2. Input validation ────────────────────────────────────────────────
    if (!fullName?.trim()) return json({ error: 'Full name is required' }, 400);
    if (!email?.trim())    return json({ error: 'Email is required' }, 400);
    if (!password)         return json({ error: 'Password is required' }, 400);
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return json({ error: 'Invalid email address' }, 400);

    const safeRole = role === 'admin' ? 'admin' : 'user';

    // ── 3. Verify caller is an authenticated admin ─────────────────────────
    // Use the anon key + caller's JWT to look up their profile row.
    // This respects RLS — the anon client can only see what RLS allows.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid Authorization header' }, 401);
    }
    const callerJwt = authHeader.replace('Bearer ', '');

    // Caller client — JWT-scoped, for identity & role verification
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${callerJwt}` } },
    });

    const { data: { user: callerUser }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !callerUser) {
      return json({ error: 'Unauthorized — invalid session' }, 401);
    }

    const { data: callerProfile, error: profileErr } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileErr || !callerProfile) {
      return json({ error: 'Unauthorized — profile not found' }, 401);
    }

    if ((callerProfile as { role: string }).role !== 'admin') {
      return json({ error: 'Forbidden — admin access required' }, 403);
    }

    // ── 4. Create the new auth user (service-role only) ────────────────────
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: newAuthUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,           // skip confirmation email — admin-created accounts are pre-verified
      user_metadata: { full_name: fullName.trim() },
    });

    if (createErr) {
      const msg = createErr.message ?? 'Failed to create user';
      // Duplicate email surfaces as a 422 from Auth
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        return json({ error: 'A user with this email address already exists' }, 409);
      }
      return json({ error: msg }, 422);
    }

    const newUserId = newAuthUser.user?.id;
    if (!newUserId) {
      return json({ error: 'User created but ID not returned — contact support' }, 500);
    }

    // ── 5. Upsert public.profiles with the requested role ──────────────────
    // role is set here server-side — the browser never touches it directly.
    const { data: newProfile, error: upsertErr } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: newUserId,
          email: email.trim(),
          full_name: fullName.trim(),
          role: safeRole,
          state: state?.trim() || null,
          city: city?.trim() || null,
          language: 'en',
        },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, role, state, city, language, created_at')
      .single();

    if (upsertErr) {
      console.error('[create-user] profiles upsert error:', upsertErr);
      // Auth user was created — return partial success with a warning
      return json(
        {
          warning: 'Auth user created but profiles row could not be saved: ' + upsertErr.message,
          userId: newUserId,
        },
        207
      );
    }

    return json({ user: newProfile }, 200);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[create-user] unhandled error:', err);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
