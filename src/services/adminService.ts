/**
 * adminService.ts
 *
 * Frontend service for privileged admin operations that require the
 * Supabase service-role key. All such calls go through Edge Functions —
 * the service-role key is NEVER present in any VITE_* variable.
 *
 * The caller's JWT is forwarded in the Authorization header so the Edge
 * Function can verify the caller is an authenticated admin before acting.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'author' | 'writer';
  state?: string;
  city?: string;
}

export interface CreateUserResult {
  /** Newly created profile row on success */
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    state: string | null;
    city: string | null;
    language: string | null;
    created_at: string;
  };
  /** Non-fatal warning (auth user created but profile upsert had issues) */
  warning?: string;
  userId?: string;
  /** Error message if the operation failed */
  error?: string;
}

// ── Create user via Edge Function ──────────────────────────────────────────

export async function adminCreateUser(
  payload: CreateUserPayload
): Promise<CreateUserResult> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured.' };
  }

  // Get the caller's current JWT to forward to the Edge Function
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !sessionData.session) {
    return { error: 'No active session. Please log in again.' };
  }

  const jwt = sessionData.session.access_token;

  // Derive the Edge Function URL from the project URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const functionUrl = `${supabaseUrl}/functions/v1/create-user`;

  let response: Response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward caller JWT — Edge Function uses this to verify admin role
        'Authorization': `Bearer ${jwt}`,
        // Also send the anon key as apikey header (required by Supabase Edge runtime)
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        password: payload.password,
        role: payload.role,
        state: payload.state?.trim() || undefined,
        city: payload.city?.trim() || undefined,
      }),
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
    return {
      error: `Could not reach Edge Function — ${msg}. ` +
             `Ensure the create-user function is deployed: supabase functions deploy create-user`,
    };
  }

  let json: CreateUserResult;
  try {
    json = (await response.json()) as CreateUserResult;
  } catch {
    return { error: `Edge Function returned non-JSON response (HTTP ${response.status})` };
  }

  if (!response.ok) {
    return { error: json.error ?? `Edge Function error (HTTP ${response.status})` };
  }

  return json;
}

// ── Delete user via Edge Function ──────────────────────────────────────────

export interface DeleteUserResult {
  success?: boolean;
  deletedId?: string;
  error?: string;
}

export async function adminDeleteUser(
  targetUserId: string
): Promise<DeleteUserResult> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured.' };
  }

  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !sessionData.session) {
    return { error: 'No active session. Please log in again.' };
  }

  const jwt = sessionData.session.access_token;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const functionUrl = `${supabaseUrl}/functions/v1/delete-user`;

  let response: Response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ targetUserId }),
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
    return {
      error:
        `Could not reach Edge Function — ${msg}. ` +
        `Ensure the delete-user function is deployed: supabase functions deploy delete-user`,
    };
  }

  let json: DeleteUserResult;
  try {
    json = (await response.json()) as DeleteUserResult;
  } catch {
    return { error: `Edge Function returned non-JSON response (HTTP ${response.status})` };
  }

  if (!response.ok) {
    return { error: json.error ?? `Edge Function error (HTTP ${response.status})` };
  }

  return json;
}

// ── Update user role directly on public.profiles ──────────────────────────
// This is safe because:
//   • protect_profile_role() trigger enforces that only admins can change role
//   • RLS policies gate the UPDATE to admins only
//   • No service-role key is ever used

export interface UpdateRoleResult {
  success?: boolean;
  error?: string;
}

export async function adminUpdateUserRole(
  targetUserId: string,
  newRole: 'user' | 'admin' | 'author' | 'writer'
): Promise<UpdateRoleResult> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured.' };
  }

  // 1. Verify caller is authenticated
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !sessionData.session) {
    return { error: 'No active session. Please log in again.' };
  }

  // 2. Verify caller's own role is 'admin' in public.profiles
  const callerId = sessionData.session.user.id;
  const { data: callerProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single();

  if (profileErr || !callerProfile) {
    return { error: `Failed to verify admin privileges: ${profileErr?.message ?? 'Profile not found'}` };
  }

  if ((callerProfile as { role: string }).role !== 'admin') {
    return { error: 'Access denied: only admins can change user roles.' };
  }

  // 3. Update the role on the target profile
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (updateErr) {
    console.error('[adminService] updateUserRole error:', updateErr);
    return { error: updateErr.message };
  }

  return { success: true };
}
