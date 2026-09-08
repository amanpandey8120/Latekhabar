import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  // Guard flag to prevent race conditions when updating profile
  const _skipNextAuthSync = useRef(false);

  // ── Core: fetch profile row from public.profiles ──────────────────────────
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
      console.error('[AuthContext] profiles SELECT failed:', {
        code: fetchErr.code,
        message: fetchErr.message,
        details: fetchErr.details,
        hint: fetchErr.hint,
      });
      throw new Error(fetchErr.message);
    }

    if (row) {
      return buildProfileFromRow(row as Record<string, unknown>, sessionUser);
    }

    // No row yet — upsert a minimal record
    const fullName =
      sessionUser.user_metadata?.full_name ||
      sessionUser.email?.split('@')[0] ||
      'User';

    const { data: upserted, error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: sessionUser.id,
          email: sessionUser.email || '',
          full_name: fullName,
        },
        { onConflict: 'id' }
      )
      .select('id, full_name, email, role, avatar_url, state, city, language, created_at')
      .single();

    if (upsertErr) {
      console.error('[AuthContext] profiles upsert failed:', upsertErr);
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

  // ── Bootstrap: rely on onAuthStateChange ──────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (_skipNextAuthSync.current) {
          _skipNextAuthSync.current = false;
          setLoading(false);
          return;
        }

        try {
          const profile = await fetchAndSyncProfile(session.user);
          setUser(profile);

          const ids = await loadBookmarkIds();
          setSavedArticleIds(ids);
        } catch (err) {
          console.error('[AuthContext] failed to sync profile after auth event:', err);
        }
      } else {
        setUser(null);
        setSavedArticleIds([]);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const signUpWithEmail = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ user: unknown; error: unknown }> => {
    if (!isSupabaseConfigured()) {
      return { user: null, error: new Error('Supabase Auth is not configured.') };
    }

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
        console.error('[AuthContext] profiles upsert after signup failed:', profileErr);
        return { user: data.user, error: profileErr };
      }
    }

    return { user: data.user, error: null };
  };

  // ── Sign In with Email ────────────────────────────────────────────────────
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ user: unknown; profile: UserProfile | null; error: unknown }> => {
    if (!isSupabaseConfigured()) {
      return { user: null, profile: null, error: new Error('Supabase Auth is not configured.') };
    }

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      console.error('[AuthContext] signIn error:', authErr);
      return { user: null, profile: null, error: authErr };
    }

    if (data?.user) {
      try {
        const profile = await fetchAndSyncProfile(data.user);
        setUser(profile);
        const ids = await loadBookmarkIds();
        setSavedArticleIds(ids);
        return { user: data.user, profile, error: null };
      } catch (err) {
        console.error('[AuthContext] signIn profile fetch failed:', err);
        return { user: data.user, profile: null, error: err };
      }
    }

    return { user: data.user, profile: null, error: null };
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('[AuthContext] Supabase Auth is not configured.');
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
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
    return { error: new Error('Supabase is not configured.') };
  };

  const resetPasswordForEmail = (email: string) => resetPassword(email);

  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      return { user: data?.user ?? null, error };
    }
    return { user: null, error: new Error('Supabase is not configured.') };
  };

  // ── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ error: unknown }> => {
    if (!user) return { error: new Error('No user logged in') };
    if (!isSupabaseConfigured()) return { error: new Error('Supabase is not configured.') };

    const dbPayload: Record<string, string | null> = {};
    if (updates.fullName !== undefined)  dbPayload.full_name  = updates.fullName || null;
    if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl || null;
    if (updates.language !== undefined)  dbPayload.language   = updates.language;
    if (updates.state !== undefined)     dbPayload.state      = updates.state || null;
    if (updates.city !== undefined)      dbPayload.city       = updates.city || null;

    const { data: liveAuthData, error: liveAuthErr } = await supabase.auth.getUser();
    if (liveAuthErr || !liveAuthData?.user) {
      return { error: new Error(`No active session: ${liveAuthErr?.message || 'Unauthorized'}`) };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(dbPayload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[AuthContext] profiles UPDATE failed:', error);
      return { error };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const freshProfile = buildProfileFromRow(data as Record<string, unknown>, {
      id: user.id,
      email: user.email,
      created_at: sessionData?.session?.user?.created_at ?? user.createdAt,
    });

    _skipNextAuthSync.current = true;
    setUser(freshProfile);

    return { error: null };
  };

  // ── Avatar Upload ─────────────────────────────────────────────────────────
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

    if (!isSupabaseConfigured()) {
      return { url: null, error: new Error('Supabase Storage is not configured.') };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${user.id}/avatar.${fileExt}`;

    await supabase.storage.from('user-avatars').remove([filePath]);

    const { error: uploadErr } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadErr) {
      console.error('[AuthContext] avatar storage upload failed:', uploadErr);
      return {
        url: null,
        error: new Error(`Storage upload failed: ${uploadErr.message}`),
      };
    }

    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    return { url: publicUrl, error: null };
  };

  // ── Atomic: Upload avatar → save URL to profiles → re-fetch ──────────────
  const uploadAndSaveAvatar = async (file: File): Promise<{ error: unknown }> => {
    if (!user) return { error: new Error('No user logged in') };
    if (!isSupabaseConfigured()) return { error: new Error('Supabase is not configured.') };

    const { url, error: uploadErr } = await uploadAvatarFile(file);
    if (uploadErr || !url) {
      return { error: uploadErr ?? new Error('Upload returned no URL') };
    }

    const { data: updatedRow, error: dbErr } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id)
      .select('id, full_name, email, role, avatar_url, state, city, language, created_at')
      .single();

    if (dbErr) {
      console.error('[uploadAndSaveAvatar] profiles UPDATE failed:', dbErr);
      return {
        error: new Error(`Avatar saved to Storage but profiles.avatar_url UPDATE failed: ${dbErr.message}`),
      };
    }

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

    return { error: null };
  };

  // ── Bookmark toggle ───────────────────────────────────────────────────────
  const toggleSaveArticle = (articleId: string) => {
    const isSaved = savedArticleIds.includes(articleId);

    // Optimistic UI update
    setSavedArticleIds((prev) =>
      isSaved ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );

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
