import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ADMIN_USER } from '../lib/mockData';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsAdminMock: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
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

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const uProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          role: session.user.email?.includes('admin') ? 'admin' : 'user',
          language: 'en',
          preferredCategories: ['cat-1', 'cat-3'],
          createdAt: session.user.created_at,
        };
        setUser(uProfile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const uProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          role: session.user.email?.includes('admin') ? 'admin' : 'user',
          language: 'en',
          preferredCategories: ['cat-1', 'cat-3'],
          createdAt: session.user.created_at,
        };
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

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } else {
      // Fallback mock user sign in
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
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('latekhabar_user');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('latekhabar_user', JSON.stringify(updated));
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
        signInAsAdminMock,
        signOut,
        updateProfile,
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
