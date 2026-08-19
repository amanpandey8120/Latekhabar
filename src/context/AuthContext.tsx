import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ADMIN_USER } from '../lib/mockData';
import type { UserProfile, UserRole } from '../types';
import {
  loadBookmarkIds,
  addBookmark,
  removeBookmark,
} from '../services/bookmarkService';

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
  savedArticleIds: string[];
  toggleSaveArticle: (articleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('latekhabar_user');
    return saved ? (JSON.parse(saved) as UserProfile) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Bookmark IDs — empty by default; populated from Supabase after auth
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  // ── Sync profile from public.profiles ──────────────────────────────────────
  const syncUserProfile = async (sessionUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
    created_at?: string;
  }): Promise<UserProfile> => {
    let role: UserRole = 'user';
    let fullName =
      sessionUser.user_metadata?.full_name ||
      sessionUser.email?.split('@')[0] ||
      'User';
    let avatarUrl =
      sessionUser.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    let state: string | undefined = undefined;
    let city: string | undefined = undefined;
    let language: 'en' | 'hi' = 'en';

    if (isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, avatar_url, state, city, language')
          .eq('id', sessionUser.id)
          .single();

        if (profile) {
          if (profile.full_name) fullName = profile.full_name as string;
          if (profile.role === 'admin') role = 'admin';
          if (profile.avatar_url) avatarUrl = profile.avatar_url as string;
          if (profile.state) state = profile.state as string;
          if (profile.city) city = profile.city as string;
          if (profile.language === 'hi' || profile.language === 'en') {
            language = profile.language as 'en' | 'hi';
          }
        }
      } catch (err) {
        console.warn('Unable to query public.profiles:', err);
      }
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      fullName,
      avatarUrl,
      role,
      language,
      preferredCategories: [],
      state,
      city,
      createdAt: sessionUser.created_at || new Date().toISOString(),
    };
  };

  // ── Bootstrap: check existing session on mount ─────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const uProfile = await syncUserProfile(session.user);
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
        // Load bookmarks from Supabase
        const ids = await loadBookmarkIds();
        setSavedArticleIds(ids);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const uProfile = await syncUserProfile(session.user);
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
        // Reload bookmarks whenever auth state changes (e.g. page refresh, re-login)
        const ids = await loadBookmarkIds();
        setSavedArticleIds(ids);
      } else {
        // Session ended (logout, token expiry, etc.)
        setUser(null);
        setSavedArticleIds([]);
        localStorage.removeItem('latekhabar_user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const signUpWithEmail = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) return { user: null, error };

      if (data?.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, full_name: fullName, email }]);

          if (
            profileError &&
            (profileError.code === '23502' ||
              profileError.message.includes('role'))
          ) {
            await supabase
              .from('profiles')
              .insert([{ id: data.user.id, full_name: fullName, email, role: 'user' }]);
          }
        } catch (e) {
          console.warn('Error inserting into public.profiles:', e);
        }

        const uProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
          role: 'user',
          language: 'en',
          preferredCategories: [],
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
      }

      return { user: data.user, error: null };
    }

    // ── Mock mode ──
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

  // ── Sign In ────────────────────────────────────────────────────────────────
  const signInWithEmail = async (email: string, password: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { user: null, profile: null, error };

      if (data?.user) {
        const uProfile = await syncUserProfile(data.user);
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
        const ids = await loadBookmarkIds();
        setSavedArticleIds(ids);
        return { user: data.user, profile: uProfile, error: null };
      }

      return { user: data.user, profile: null, error: null };
    }

    // ── Mock mode ──
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

  // ── Google OAuth ───────────────────────────────────────────────────────────
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

  // ── Dev-only mock admin login ──────────────────────────────────────────────
  const signInAsAdminMock = () => {
    setUser(MOCK_ADMIN_USER);
    localStorage.setItem('latekhabar_user', JSON.stringify(MOCK_ADMIN_USER));
  };

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn('Supabase auth signOut error:', error);
      }
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setSavedArticleIds([]);
      localStorage.removeItem('latekhabar_user');
    }
  };

  // ── Password helpers ───────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    }
    return { error: null };
  };

  const resetPasswordForEmail = async (email: string) => resetPassword(email);

  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { user: data?.user ?? null, error };
    }
    return { user: null, error: null };
  };

  // ── Update profile (never allows role or email changes) ───────────────────
  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ error: unknown }> => {
    if (!user) return { error: new Error('No user logged in') };

    // Only these columns are allowed — role and email are intentionally excluded
    const dbUpdates: Record<string, string | null | undefined> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.state !== undefined) dbUpdates.state = updates.state || null;
    if (updates.city !== undefined) dbUpdates.city = updates.city || null;

    if (isSupabaseConfigured()) {
      try {
        const { error: dbErr } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);

        if (dbErr) {
          console.warn('Supabase profile update error:', dbErr);
          return { error: dbErr };
        }
      } catch (err) {
        console.warn('Profile DB update exception:', err);
        return { error: err };
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      role: user.role,   // role is immutable from the frontend
      email: user.email, // email is immutable from the frontend
    };
    setUser(updatedUser);
    localStorage.setItem('latekhabar_user', JSON.stringify(updatedUser));
    return { error: null };
  };

  // ── Avatar upload to user-avatars/{userId}/{timestamp}.ext ────────────────
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
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        // Path scoped to the user's own folder — RLS prevents cross-user access
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, file, { upsert: true, contentType: file.type });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('user-avatars')
            .getPublicUrl(filePath);
          return { url: urlData.publicUrl, error: null };
        }

        console.warn('Supabase storage upload warning:', uploadErr);
        // Fall through to data-URL fallback below
      } catch (err) {
        console.warn('Storage upload exception:', err);
      }
    }

    // Fallback: return a data-URL so the UI can preview without a bucket
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, error: null };
  };

  // ── Bookmark toggle — Supabase-first, optimistic UI update ────────────────
  const toggleSaveArticle = (articleId: string) => {
    const isCurrentlySaved = savedArticleIds.includes(articleId);

    // Optimistic UI
    setSavedArticleIds((prev) =>
      isCurrentlySaved
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId]
    );

    // Persist to Supabase (or mock store) in the background
    if (isCurrentlySaved) {
      removeBookmark(articleId).catch((err) =>
        console.warn('removeBookmark failed:', err)
      );
    } else {
      addBookmark(articleId).catch((err) =>
        console.warn('addBookmark failed:', err)
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
