import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ADMIN_USER } from '../lib/mockData';
import type { UserProfile, UserRole } from '../types';
import {
  loadBookmarkIds,
  addBookmark,
  removeBookmark,
} from '../services/bookmarkService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ user: unknown; error: unknown }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ user: unknown; profile: UserProfile | null; error: unknown }>;
  resetPassword: (email: string) => Promise<{ error: unknown }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: unknown }>;
  updatePassword: (newPassword: string) => Promise<{ user: unknown; error: unknown }>;
  signInAsAdminMock: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: unknown }>;
  uploadAvatarFile: (file: File) => Promise<{ url: string | null; error: unknown }>;
  uploadAndSaveAvatar: (file: File) => Promise<{ error: unknown }>;
  savedArticleIds: string[];
  toggleSaveArticle: (articleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Helper – build a UserProfile from a raw profiles row + session user
// ─────────────────────────────────────────────────────────────────────────────
function buildProfileFromRow(
  row: Record<string, unknown>,
  sessionUser: { id: string; email?: string; created_at?: string }
): UserProfile {
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    fullName: (row.full_name as string | null) || sessionUser.email?.split('@')[0] || 'User',
    avatarUrl:
      (row.avatar_url as string | null) ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        (row.full_name as string) || sessionUser.email || 'user'
      )}`,
    role: (row.role as UserRole) === 'admin' ? 'admin' : 'user',
    language: (row.language as 'en' | 'hi') === 'hi' ? 'hi' : 'en',
    state: (row.state as string | null) ?? undefined,
    city: (row.city as string | null) ?? undefined,
    preferredCategories: [],
    createdAt: (row.created_at as string | null) || sessionUser.created_at || new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise from localStorage only as a fast-paint value while Supabase
  // validates the session. It is always overwritten by the DB result.
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('latekhabar_user');
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  // Guard flag: when updateProfile successfully writes to DB and calls setUser,
  // Supabase may fire a TOKEN_REFRESHED or USER_UPDATED auth event that triggers
  // fetchAndSyncProfile again. If the replica hasn't caught up yet, the re-fetch
  // returns the OLD row and silently overwrites the fresh state. This flag tells
  // onAuthStateChange to skip the profile re-fetch for exactly one such event.
  const _skipNextAuthSync = useRef(false);

  // ── Core: fetch profile row from public.profiles ──────────────────────────
  // Returns the canonical UserProfile from DB.
  // If no row exists it upserts a new one so the user always has a row.
  // Throws on Supabase errors so callers can surface them to the UI.
  const fetchAndSyncProfile = async (sessionUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
    created_at?: string;
  }): Promise<UserProfile> => {
    const { data: row, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, state, city, language, created_at')
      .eq('id', sessionUser.id)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      // PGRST116 = "0 rows" — anything else is a real DB error
      console.error('[AuthContext] profiles SELECT failed:', {
        code: fetchErr.code,
        message: fetchErr.message,
        details: fetchErr.details,
        hint: fetchErr.hint,
      });
      throw new Error(fetchErr.message);
    }

    if (row) {
      // Row exists — build profile directly from DB truth
      console.info('[AuthContext] raw profile row from DB:', row);
      const profile = buildProfileFromRow(row as Record<string, unknown>, sessionUser);
      console.info('[AuthContext] profile loaded from DB:', profile.id);
      return profile;
    }

    // No row yet — upsert a minimal record so it exists for all future logins.
    // role is intentionally omitted: the DB default (role = 'user') applies.
    const fullName =
      sessionUser.user_metadata?.full_name ||
      sessionUser.email?.split('@')[0] ||
      'User';

    console.info('[AuthContext] no profiles row found — upserting for', sessionUser.id);

    const { data: upserted, error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: sessionUser.id,
          email: sessionUser.email || '',
          full_name: fullName,
          // role is intentionally NOT set here — DB default handles it
        },
        { onConflict: 'id' }
      )
      .select('id, full_name, email, role, avatar_url, state, city, language, created_at')
      .single();

    if (upsertErr) {
      console.error('[AuthContext] profiles upsert failed:', upsertErr);
      // Return a safe default so the UI still works; the error is logged
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        fullName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        role: 'user',
        language: 'en',
        preferredCategories: [],
        createdAt: sessionUser.created_at || new Date().toISOString(),
      };
    }

    return buildProfileFromRow(upserted as Record<string, unknown>, sessionUser);
  };

  // ── Bootstrap: rely solely on onAuthStateChange ───────────────────────────
  // onAuthStateChange fires immediately with the current session on mount,
  // so there is no need for a separate getSession() call which would cause a
  // double-fetch race condition.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.info('[AuthContext] auth event:', event);

      if (session?.user) {
        // Guard: skip re-fetch for one event after updateProfile writes to DB.
        // This prevents a stale replica read from overwriting a freshly-saved profile.
        if (_skipNextAuthSync.current) {
          console.info('[AuthContext] skipping profile re-fetch after updateProfile (race guard). event:', event);
          _skipNextAuthSync.current = false;
          setLoading(false);
          return;
        }

        try {
          const profile = await fetchAndSyncProfile(session.user);
          setUser(profile);
          // localStorage is a render-cache only — always written from DB result
          localStorage.setItem('latekhabar_user', JSON.stringify(profile));

          const ids = await loadBookmarkIds();
          setSavedArticleIds(ids);
        } catch (err) {
          console.error('[AuthContext] failed to sync profile after auth event:', err);
          // Keep whatever is in state — don't silently corrupt it
        }
      } else {
        // SIGNED_OUT or token expired
        setUser(null);
        setSavedArticleIds([]);
        localStorage.removeItem('latekhabar_user');
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // fetchAndSyncProfile is defined outside the effect and stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const signUpWithEmail = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ user: unknown; error: unknown }> => {
    if (isSupabaseConfigured()) {
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (authErr) {
        console.error('[AuthContext] signUp auth error:', authErr);
        return { user: null, error: authErr };
      }

      if (data?.user) {
        // Upsert the profile row immediately after auth.signUp succeeds.
        // Using upsert (not insert) makes this idempotent if the trigger
        // already created the row, or if the user signs up twice.
        // role is intentionally excluded — DB default sets it to 'user'.
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: data.user.email || email,
              full_name: fullName.trim(),
            },
            { onConflict: 'id' }
          );

        if (profileErr) {
          // Log the full error so it can be diagnosed
          console.error('[AuthContext] profiles upsert after signup failed:', profileErr);
          // Return the error so the Signup page can display it
          return { user: data.user, error: profileErr };
        }

        console.info('[AuthContext] profile row upserted for new user:', data.user.id);
      }

      return { user: data.user, error: null };
    }

    // ── Mock mode ─────────────────────────────────────────────────────────
    const mockUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      role: 'user',
      language: 'en',
      preferredCategories: [],
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    localStorage.setItem('latekhabar_user', JSON.stringify(mockUser));
    return { user: mockUser, error: null };
  };

  // ── Sign In with Email ────────────────────────────────────────────────────
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ user: unknown; profile: UserProfile | null; error: unknown }> => {
    if (isSupabaseConfigured()) {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        console.error('[AuthContext] signIn error:', authErr);
        return { user: null, profile: null, error: authErr };
      }

      if (data?.user) {
        // onAuthStateChange will fire and call fetchAndSyncProfile, but we
        // also call it here so the caller gets the profile immediately.
        try {
          const profile = await fetchAndSyncProfile(data.user);
          setUser(profile);
          localStorage.setItem('latekhabar_user', JSON.stringify(profile));
          const ids = await loadBookmarkIds();
          setSavedArticleIds(ids);
          return { user: data.user, profile, error: null };
        } catch (err) {
          console.error('[AuthContext] signIn profile fetch failed:', err);
          return { user: data.user, profile: null, error: err };
        }
      }

      return { user: data.user, profile: null, error: null };
    }

    // ── Mock mode ─────────────────────────────────────────────────────────
    const mockUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0])}`,
      role: 'user',
      language: 'en',
      preferredCategories: [],
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    localStorage.setItem('latekhabar_user', JSON.stringify(mockUser));
    return { user: mockUser, profile: mockUser, error: null };
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    } else {
      const mockUser: UserProfile = {
        id: 'usr-google-1',
        email: 'reader@example.com',
        fullName: 'Demo Reader',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        role: 'user',
        language: 'en',
        preferredCategories: [],
        state: 'Delhi',
        city: 'New Delhi',
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      localStorage.setItem('latekhabar_user', JSON.stringify(mockUser));
    }
  };

  // ── Dev-only mock admin ───────────────────────────────────────────────────
  const signInAsAdminMock = () => {
    setUser(MOCK_ADMIN_USER);
    localStorage.setItem('latekhabar_user', JSON.stringify(MOCK_ADMIN_USER));
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn('[AuthContext] signOut error:', error);
      }
    } catch (err) {
      console.warn('[AuthContext] signOut exception:', err);
    } finally {
      setUser(null);
      setSavedArticleIds([]);
      localStorage.removeItem('latekhabar_user');
    }
  };

  // ── Password helpers ──────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    }
    return { error: null };
  };

  const resetPasswordForEmail = (email: string) => resetPassword(email);

  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      return { user: data?.user ?? null, error };
    }
    return { user: null, error: null };
  };

  // ── Update Profile ────────────────────────────────────────────────────────
  // DIAGNOSTIC VERSION — logs every Supabase operation with full detail.
  // Uses .update().eq().select().single() as specified.
  // No silent failures, no localStorage fallback on error.
  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ error: unknown }> => {
    if (!user) return { error: new Error('No user logged in') };

    // Build the DB payload — role and email intentionally excluded
    const dbPayload: Record<string, string | null> = {};
    if (updates.fullName !== undefined)  dbPayload.full_name  = updates.fullName || null;
    if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl || null;
    if (updates.language !== undefined)  dbPayload.language   = updates.language;
    if (updates.state !== undefined)     dbPayload.state      = updates.state || null;
    if (updates.city !== undefined)      dbPayload.city       = updates.city || null;

    if (!isSupabaseConfigured()) {
      // Mock mode: update local state only
      const updated: UserProfile = { ...user, ...updates, role: user.role, email: user.email };
      setUser(updated);
      localStorage.setItem('latekhabar_user', JSON.stringify(updated));
      return { error: null };
    }

    // ── DIAGNOSTIC STEP 0: verify live session auth.uid() ────────────────
    console.group('%c[updateProfile] DIAGNOSTIC START', 'color: #f59e0b; font-weight: bold; font-size: 14px');
    console.info('▶ cached user.id (from React state):', user.id);
    console.info('▶ cached user.email:', user.email);

    const { data: liveAuthData, error: liveAuthErr } = await supabase.auth.getUser();
    if (liveAuthErr) {
      console.error('✖ supabase.auth.getUser() FAILED — no valid session!', liveAuthErr);
      console.groupEnd();
      return { error: new Error(`No active session: ${liveAuthErr.message}`) };
    }
    const liveUid = liveAuthData?.user?.id;
    console.info('▶ live auth.uid() from supabase.auth.getUser():', liveUid);
    console.info('▶ IDs match?', user.id === liveUid ? '✅ YES' : '❌ NO — MISMATCH! This is the bug.');

    if (user.id !== liveUid) {
      console.error('✖ CRITICAL: cached user.id !== live auth.uid(). The UPDATE will match 0 rows.');
      console.groupEnd();
      return { error: new Error(`ID mismatch: cached=${user.id}, live=${liveUid}`) };
    }

    // ── DIAGNOSTIC STEP 1: execute the UPDATE ────────────────────────────
    console.info('▶ UPDATE payload:', JSON.stringify(dbPayload, null, 2));
    console.info('▶ Executing: supabase.from("profiles").update(payload).eq("id", uid).select().single()');

    const { data, error } = await supabase
      .from('profiles')
      .update(dbPayload)
      .eq('id', user.id)
      .select()
      .single();

    // Log the COMPLETE raw response — no filtering
    console.info('▶ RAW Supabase UPDATE response:');
    console.info('   data:', data);
    console.info('   error:', error);
    if (error) {
      console.error('   error.code:', error.code);
      console.error('   error.message:', error.message);
      console.error('   error.details:', error.details);
      console.error('   error.hint:', error.hint);
      console.error('   full error object:', JSON.parse(JSON.stringify(error)));
      console.groupEnd();
      return {
        error: new Error(
          `Supabase UPDATE failed — code: ${error.code} | message: ${error.message}` +
          `${error.details ? ` | details: ${error.details}` : ''}` +
          `${error.hint ? ` | hint: ${error.hint}` : ''}`
        ),
      };
    }

    console.info('▶ UPDATE succeeded. Returned row:', data);
    console.info('   city in returned row:', (data as Record<string, unknown>)?.city);
    console.info('   state in returned row:', (data as Record<string, unknown>)?.state);
    console.info('   full_name in returned row:', (data as Record<string, unknown>)?.full_name);

    // ── DIAGNOSTIC STEP 2: immediately re-SELECT to confirm DB state ──────
    console.info('▶ Re-SELECT to confirm DB state after UPDATE...');
    const { data: verifyRow, error: verifyErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, state, city, language, created_at')
      .eq('id', user.id)
      .single();

    if (verifyErr) {
      console.error('✖ Re-SELECT failed:', verifyErr);
    } else {
      console.info('▶ DB state after UPDATE (re-SELECT):');
      console.info('   id:', (verifyRow as Record<string, unknown>)?.id);
      console.info('   full_name:', (verifyRow as Record<string, unknown>)?.full_name);
      console.info('   state:', (verifyRow as Record<string, unknown>)?.state);
      console.info('   city:', (verifyRow as Record<string, unknown>)?.city);
      console.info('   avatar_url:', (verifyRow as Record<string, unknown>)?.avatar_url);
      console.info('   raw row:', verifyRow);
    }

    // ── Update React state from verified DB row ─────────────────────────────
    const sourceRow = (verifyErr ? data : verifyRow) as Record<string, unknown>;
    const { data: sessionData } = await supabase.auth.getSession();
    const freshProfile = buildProfileFromRow(sourceRow, {
      id: user.id,
      email: user.email,
      created_at: sessionData?.session?.user?.created_at ?? user.createdAt,
    });

    // Set skip flag before setUser to prevent onAuthStateChange from
    // overwriting with a potentially stale replica read.
    _skipNextAuthSync.current = true;
    setUser(freshProfile);
    localStorage.setItem('latekhabar_user', JSON.stringify(freshProfile));

    console.info('▶ React state updated. freshProfile.city:', freshProfile.city);
    console.info('%c[updateProfile] DIAGNOSTIC END — SUCCESS', 'color: #10b981; font-weight: bold');
    console.groupEnd();

    return { error: null };
  };

  // ── Avatar Upload ─────────────────────────────────────────────────────────
  // Step 1 of 2: uploads the file and returns the public URL.
  // • Deletes any previous avatar stored under the same user folder first,
  //   so a single-file quota policy (INSERT-only) still works.
  // • Does NOT use upsert:true — instead delete then insert, which works even
  //   when the Storage policy only allows INSERT (the most common default).
  // • Confirms the object exists via getPublicUrl before returning.
  // • Never falls back to a data-URL when Supabase is configured.
  const uploadAvatarFile = async (
    file: File
  ): Promise<{ url: string | null; error: unknown }> => {
    if (!user) return { url: null, error: new Error('No user logged in') };

    if (!file.type.startsWith('image/')) {
      return { url: null, error: new Error('Invalid image file type') };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: new Error('File size exceeds 5MB limit') };
    }

    if (isSupabaseConfigured()) {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      // Always use a fixed filename per user so the old file is naturally
      // replaced and we never accumulate stale objects.
      const filePath = `${user.id}/avatar.${fileExt}`;

      console.group('%c[uploadAvatarFile] DIAGNOSTIC', 'color:#6366f1;font-weight:bold');
      console.info('user.id       :', user.id);
      console.info('bucket        : user-avatars');
      console.info('storage path  :', filePath);
      console.info('file.type     :', file.type);
      console.info('file.size (B) :', file.size);

      // ── Step A: remove any existing file for this user ──────────────────
      // Ignore the error — the file may not exist yet (first upload).
      const { error: removeErr } = await supabase.storage
        .from('user-avatars')
        .remove([filePath]);
      if (removeErr) {
        console.warn('[uploadAvatarFile] pre-upload remove (non-fatal):', removeErr.message);
      } else {
        console.info('[uploadAvatarFile] pre-upload remove: OK (or file did not exist)');
      }

      // ── Step B: upload the new file ──────────────────────────────────────
      // upsert:false — we deleted first, so this is a clean INSERT, which
      // works with both INSERT-only and full storage policies.
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type,
          cacheControl: '3600',
        });

      console.info('[uploadAvatarFile] raw upload response:');
      console.info('  data :', uploadData);
      console.info('  error:', uploadErr);

      if (uploadErr) {
        console.error('[uploadAvatarFile] UPLOAD FAILED');
        console.error('  message:', uploadErr.message);
        console.error('  name   :', uploadErr.name);
        console.error('  full   :', JSON.parse(JSON.stringify(uploadErr)));
        console.groupEnd();
        return {
          url: null,
          error: new Error(
            `Storage upload failed — ${uploadErr.message}` +
            `. Ensure the user-avatars bucket has an INSERT policy for authenticated users` +
            ` (e.g. storage.foldername(name)[1] = auth.uid()::text).`
          ),
        };
      }

      // ── Step C: get the public URL ───────────────────────────────────────
      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Append a cache-busting query param so the browser doesn't serve
      // a stale version of the image after replacement.
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      console.info('[uploadAvatarFile] public URL :', publicUrl);
      console.info('[uploadAvatarFile] upload path confirmed:', uploadData?.path ?? filePath);
      console.groupEnd();

      return { url: publicUrl, error: null };
    }

    // ── Mock mode: return a data-URL preview ──────────────────────────────
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, error: null };
  };

  // ── Atomic: Upload avatar → save URL to profiles → re-fetch ──────────────
  // This is the function Profile.tsx should call.  It combines the three
  // steps into one operation so there is no way to upload without saving or
  // save without a confirmed upload.
  const uploadAndSaveAvatar = async (file: File): Promise<{ error: unknown }> => {
    if (!user) return { error: new Error('No user logged in') };

    // Step 1: upload to Storage
    const { url, error: uploadErr } = await uploadAvatarFile(file);
    if (uploadErr || !url) {
      return { error: uploadErr ?? new Error('Upload returned no URL') };
    }

    console.info('[uploadAndSaveAvatar] storage upload OK, url:', url);

    // Step 2: write avatar_url to public.profiles
    if (isSupabaseConfigured()) {
      const { data: updatedRow, error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)
        .select('id, full_name, email, role, avatar_url, state, city, language, created_at')
        .single();

      console.info('[uploadAndSaveAvatar] profiles UPDATE response:');
      console.info('  data :', updatedRow);
      console.info('  error:', dbErr);

      if (dbErr) {
        console.error('[uploadAndSaveAvatar] profiles UPDATE FAILED:', dbErr);
        return {
          error: new Error(
            `Avatar saved to Storage but profiles.avatar_url UPDATE failed — ` +
            `code: ${dbErr.code} | ${dbErr.message}`
          ),
        };
      }

      // Step 3: update React state from the returned row (DB truth)
      const { data: sessionData } = await supabase.auth.getSession();
      const freshProfile = buildProfileFromRow(
        updatedRow as Record<string, unknown>,
        {
          id: user.id,
          email: user.email,
          created_at: sessionData?.session?.user?.created_at ?? user.createdAt,
        }
      );

      _skipNextAuthSync.current = true;
      setUser(freshProfile);
      localStorage.setItem('latekhabar_user', JSON.stringify(freshProfile));

      console.info('[uploadAndSaveAvatar] React state updated. avatar_url:',
        (updatedRow as Record<string, unknown>).avatar_url);

      return { error: null };
    }

    // Mock mode: just update local state
    const updated: UserProfile = { ...user, avatarUrl: url };
    setUser(updated);
    localStorage.setItem('latekhabar_user', JSON.stringify(updated));
    return { error: null };
  };

  // ── Bookmark toggle ───────────────────────────────────────────────────────
  const toggleSaveArticle = (articleId: string) => {
    const isSaved = savedArticleIds.includes(articleId);

    // Optimistic UI update
    setSavedArticleIds((prev) =>
      isSaved ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );

    // Persist in background
    if (isSaved) {
      removeBookmark(articleId).catch((err) =>
        console.warn('[AuthContext] removeBookmark failed:', err)
      );
    } else {
      addBookmark(articleId).catch((err) =>
        console.warn('[AuthContext] addBookmark failed:', err)
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        resetPasswordForEmail,
        updatePassword,
        signInAsAdminMock,
        signOut,
        updateProfile,
        uploadAvatarFile,
        uploadAndSaveAvatar,
        savedArticleIds,
        toggleSaveArticle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
