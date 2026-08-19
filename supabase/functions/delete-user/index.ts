/**
 * Supabase Edge Function: delete-user
 *
 * Secure server-side user deletion for the Late Khabar admin portal.
 *
 * Flow:
 *   1. Verify the caller has a valid Supabase JWT (authenticated).
 *   2. Verify the caller's public.profiles.role = 'admin' — server-side,
 *      never trusting a role value from the request body.
 *   3. Reject self-deletion (admin cannot delete their own account).
 *   4. Delete the target user from auth.users via the Admin Auth API.
 *      Cascading FK rules or a DB trigger will handle profiles cleanup;
 *      we also explicitly delete the profiles row for safety.
 *   5. Return a structured success or error response.
 *
 * SUPABASE_SERVICE_ROLE_KEY is injected by the Supabase runtime as a
 * secret — it never appears in any VITE_* variable or browser code.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // ── CORS preflight ────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return json({ ok: true }, 200);
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // ── 1. Parse and validate body ───────────────────────────────────────
    let body: { targetUserId?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { targetUserId } = body;
    if (!targetUserId?.trim()) {
      return json({ error: 'targetUserId is required' }, 400);
    }

    // Basic UUID format check — prevents obvious injection
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(targetUserId)) {
      return json({ error: 'targetUserId must be a valid UUID' }, 400);
    }

    // ── 2. Verify caller is an authenticated admin ───────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid Authorization header' }, 401);
    }
    const callerJwt = authHeader.replace('Bearer ', '');

    // JWT-scoped client — used only for identity verification
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${callerJwt}` } },
    });

    const { data: { user: callerUser }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !callerUser) {
      return json({ error: 'Unauthorized — invalid or expired session' }, 401);
    }

    // Fetch role from DB — never trust a role value sent from the browser
    const { data: callerProfile, error: profileErr } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileErr || !callerProfile) {
      return json({ error: 'Unauthorized — caller profile not found' }, 401);
    }
    if ((callerProfile as { role: string }).role !== 'admin') {
      return json({ error: 'Forbidden — admin access required' }, 403);
    }

    // ── 3. Prevent self-deletion ─────────────────────────────────────────
    if (callerUser.id === targetUserId) {
      return json({ error: 'You cannot delete your own admin account' }, 400);
    }

    // ── 4. Delete from auth.users via Admin API (service-role) ──────────
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Explicitly delete the profiles row first.
    // If a CASCADE FK exists this is a no-op; if not, it ensures cleanup.
    const { error: profileDeleteErr } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    if (profileDeleteErr) {
      // Log but do not abort — the auth deletion is the authoritative step
      console.warn('[delete-user] profiles row delete warning:', profileDeleteErr.message);
    }

    // Delete the auth user — this is irreversible
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteErr) {
      console.error('[delete-user] auth.admin.deleteUser error:', deleteErr);
      return json(
        { error: `Failed to delete user from auth: ${deleteErr.message}` },
        422
      );
    }

    console.info('[delete-user] successfully deleted user:', targetUserId, 'by admin:', callerUser.id);
    return json({ success: true, deletedId: targetUserId }, 200);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[delete-user] unhandled error:', err);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
