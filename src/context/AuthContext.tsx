import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ADMIN_USER } from '../lib/mockData';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<{ user: any; error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: any; profile: UserProfile | null; error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ user: any; error: any }>;
  signInAsAdminMock: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  uploadAvatarFile: (file: File) => Promise<{ url: string | null; error: any }>;
  savedArticleIds: string[];
  toggleSaveArticle: (articleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('latekhabar_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('latekhabar_bookmarks');
    return saved ? JSON.parse(saved) : ['art-1', 'art-3'];
  });

  const syncUserProfile = async (sessionUser: any): Promise<UserProfile> => {
    let role: UserRole = 'user';
    let fullName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User';
    let avatarUrl = sessionUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    let state: string | undefined = undefined;
    let city: string | undefined = undefined;
    let language: 'en' | 'hi' = 'en';

    if (isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (profile) {
          if (profile.full_name) fullName = profile.full_name;
          if (profile.role === 'admin') role = 'admin';
          if (profile.avatar_url) avatarUrl = profile.avatar_url;
          if (profile.state) state = profile.state;
          if (profile.city) city = profile.city;
          if (profile.language === 'hi' || profile.language === 'en') language = profile.language;
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
      preferredCategories: ['cat-1', 'cat-3'],
      state,
      city,
      createdAt: sessionUser.created_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const uProfile = await syncUserProfile(session.user);
        setUser(uProfile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const uProfile = await syncUserProfile(session.user);
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
      } else if (!user) {
        setUser(null);
        localStorage.removeItem('latekhabar_user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('latekhabar_bookmarks', JSON.stringify(savedArticleIds));
  }, [savedArticleIds]);

  const signUpWithEmail = async (fullName: string, email: string, password: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { user: null, error };
      }

      if (data?.user) {
        // Create corresponding record in public.profiles with profiles.id = auth.users.id
        // Role is omitted to allow database default role to "user" (or explicitly 'user' if required)
        try {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              full_name: fullName,
              email: email,
            },
          ]);

          if (profileError) {
            console.warn('Profile insertion warning, attempting fallback with explicit role=user:', profileError);
            if (profileError.code === '23502' || profileError.message.includes('role')) {
              await supabase.from('profiles').insert([
                {
                  id: data.user.id,
                  full_name: fullName,
                  email: email,
                  role: 'user',
                },
              ]);
            }
          }
        } catch (e) {
          console.warn('Error inserting into public.profiles:', e);
        }

        const uProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
          role: 'user',
          language: 'en',
          preferredCategories: ['cat-1', 'cat-3'],
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
      }

      return { user: data.user, error: null };
    } else {
      // Mock mode fallback for local development when Supabase env is placeholder
      const mockUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        fullName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        role: 'user',
        language: 'en',
        preferredCategories: ['cat-1', 'cat-3'],
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      localStorage.setItem('latekhabar_user', JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, profile: null, error };
      }

      if (data?.user) {
        const uProfile = await syncUserProfile(data.user);
        setUser(uProfile);
        localStorage.setItem('latekhabar_user', JSON.stringify(uProfile));
        return { user: data.user, profile: uProfile, error: null };
      }

      return { user: data.user, profile: null, error: null };
    } else {
      const mockUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        fullName: email.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0])}`,
        role: 'user',
        language: 'en',
        preferredCategories: ['cat-1', 'cat-3'],
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      localStorage.setItem('latekhabar_user', JSON.stringify(mockUser));
      return { user: mockUser, profile: mockUser, error: null };
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    }
    return { error: null };
  };

  const resetPasswordForEmail = async (email: string) => {
    return resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { user: data?.user || null, error };
    }
    return { user: null, error: null };
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } else {
      const mockUser: UserProfile = {
        id: 'usr-google-1',
        email: 'reader@example.com',
        fullName: 'Demo Reader',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        role: 'user',
        language: 'en',
        preferredCategories: ['cat-1', 'cat-2', 'cat-6'],
        state: 'Delhi',
        city: 'New Delhi',
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      localStorage.setItem('latekhabar_user', JSON.stringify(mockUser));
    }
  };

  const signInAsAdminMock = () => {
    setUser(MOCK_ADMIN_USER);
    localStorage.setItem('latekhabar_user', JSON.stringify(MOCK_ADMIN_USER));
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('Supabase auth signOut error:', error);
        }
      }
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('latekhabar_user');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: any }> => {
    if (!user) return { error: new Error('No user logged in') };

    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.city !== undefined) dbUpdates.city = updates.city;

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
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      role: user.role, // Maintain strict role integrity
      email: user.email, // Maintain email integrity
    };
    setUser(updatedUser);
    localStorage.setItem('latekhabar_user', JSON.stringify(updatedUser));
    return { error: null };
  };

  const uploadAvatarFile = async (file: File): Promise<{ url: string | null; error: any }> => {
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
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, file, { upsert: true, contentType: file.type });

        if (uploadErr) {
          console.warn('Supabase storage upload warning:', uploadErr);
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          return { url: dataUrl, error: null };
        }

        const { data: publicUrlData } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
        return { url: publicUrlData.publicUrl, error: null };
      } catch (err) {
        console.warn('Storage upload exception fallback:', err);
      }
    }

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, error: null };
  };

  const toggleSaveArticle = (articleId: string) => {
    setSavedArticleIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
