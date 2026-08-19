-- ==============================================================================
-- Late Khabar - Master Supabase Schema & Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- 2.1 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  state TEXT,
  city TEXT,
  preferred_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  description_en TEXT,
  description_hi TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_hi TEXT NOT NULL,
  excerpt_en TEXT,
  excerpt_hi TEXT,
  content_en TEXT NOT NULL,
  content_hi TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  author_avatar TEXT,
  author_role TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_breaking BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  image_caption TEXT,
  video_url TEXT,
  state TEXT,
  city TEXT,
  read_time_minutes INTEGER DEFAULT 4,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 NEWS IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.news_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption_en TEXT,
  caption_hi TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 NEWS VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.news_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  title_en TEXT,
  title_hi TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, news_id)
);

-- 2.7 NEWS VIEWS TABLE
CREATE TABLE IF NOT EXISTS public.news_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compatibility view / alias for articles -> news if legacy queries run
CREATE OR REPLACE VIEW public.articles AS SELECT * FROM public.news;

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news(slug);
CREATE INDEX IF NOT EXISTS idx_news_category_id ON public.news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON public.news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news(status, is_published);
CREATE INDEX IF NOT EXISTS idx_news_state_city ON public.news(state, city);
CREATE INDEX IF NOT EXISTS idx_news_images_news_id ON public.news_images(news_id);
CREATE INDEX IF NOT EXISTS idx_news_videos_news_id ON public.news_videos(news_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_news_id ON public.bookmarks(news_id);
CREATE INDEX IF NOT EXISTS idx_news_views_news_id ON public.news_views(news_id);
CREATE INDEX IF NOT EXISTS idx_news_views_user_id ON public.news_views(user_id);

-- ==============================================================================
-- 4. HELPER FUNCTIONS & ROLE PROTECTION TRIGGERS
-- ==============================================================================

-- 4.1 SECURE ADMIN CHECK FUNCTION
-- SECURITY DEFINER and SET search_path = public prevents RLS recursion on public.profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 4.2 ROLE PROTECTION TRIGGER (Disallows normal users from escalating role to admin)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only existing admin or internal service_role can change user roles
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'Security violation: Only administrators can modify user roles';
    END IF;
  END IF;

  -- Ensure updated_at timestamp is refreshed
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_views ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to ensure idempotency
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'categories', 'news', 'news_images', 'news_videos', 'bookmarks', 'news_views')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 6.1 PROFILES POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: Users can view their own profile, Admins can view all profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- INSERT: Authenticated users can insert their own profile with role='user', or admin
CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    (auth.uid() = id AND (role IS NULL OR role = 'user'))
    OR public.is_admin()
    OR auth.role() = 'service_role'
  );

-- UPDATE: Users can update only their own profile; Admins can update any profile
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
  );

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_admin_only"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.2 CATEGORIES POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: Public can view active categories; Admins can view all categories
CREATE POLICY "categories_select_public_active_or_admin"
  ON public.categories
  FOR SELECT
  USING (
    is_active = true
    OR public.is_admin()
  );

-- INSERT: Only admins can insert categories
CREATE POLICY "categories_insert_admin_only"
  ON public.categories
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update categories
CREATE POLICY "categories_update_admin_only"
  ON public.categories
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete categories
CREATE POLICY "categories_delete_admin_only"
  ON public.categories
  FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.3 NEWS POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: Public can view only published news; Admins can view all news
CREATE POLICY "news_select_published_or_admin"
  ON public.news
  FOR SELECT
  USING (
    (
      (status = 'published' OR is_published = true)
      AND (published_at IS NOT NULL AND published_at <= now())
    )
    OR public.is_admin()
  );

-- INSERT: Only admins can insert news
CREATE POLICY "news_insert_admin_only"
  ON public.news
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update news
CREATE POLICY "news_update_admin_only"
  ON public.news
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete news
CREATE POLICY "news_delete_admin_only"
  ON public.news
  FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.4 NEWS IMAGES POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: Public can view images for published news; Admins can view all
CREATE POLICY "news_images_select_published_or_admin"
  ON public.news_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.news
      WHERE news.id = news_images.news_id
        AND (
          ((news.status = 'published' OR news.is_published = true) AND (news.published_at IS NOT NULL AND news.published_at <= now()))
          OR public.is_admin()
        )
    )
  );

-- INSERT: Only admins can insert news images
CREATE POLICY "news_images_insert_admin_only"
  ON public.news_images
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update news images
CREATE POLICY "news_images_update_admin_only"
  ON public.news_images
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete news images
CREATE POLICY "news_images_delete_admin_only"
  ON public.news_images
  FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.5 NEWS VIDEOS POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: Public can view videos for published news; Admins can view all
CREATE POLICY "news_videos_select_published_or_admin"
  ON public.news_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.news
      WHERE news.id = news_videos.news_id
        AND (
          ((news.status = 'published' OR news.is_published = true) AND (news.published_at IS NOT NULL AND news.published_at <= now()))
          OR public.is_admin()
        )
    )
  );

-- INSERT: Only admins can insert news videos
CREATE POLICY "news_videos_insert_admin_only"
  ON public.news_videos
  FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update news videos
CREATE POLICY "news_videos_update_admin_only"
  ON public.news_videos
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete news videos
CREATE POLICY "news_videos_delete_admin_only"
  ON public.news_videos
  FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.6 BOOKMARKS POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: Authenticated users can view only their own bookmarks
CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Authenticated users can insert only for themselves
CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Authenticated users can update only their own bookmarks
CREATE POLICY "bookmarks_update_own"
  ON public.bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Authenticated users can delete only their own bookmarks
CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6.7 NEWS VIEWS POLICIES
-- ------------------------------------------------------------------------------

-- INSERT: Public and authenticated users can insert view metrics; cannot spoof other user_id
CREATE POLICY "news_views_insert_public"
  ON public.news_views
  FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
  );

-- SELECT: Users can view their own history; Admins can access all views for analytics
CREATE POLICY "news_views_select_own_or_admin"
  ON public.news_views
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- UPDATE / DELETE: Only admins can manage views records
CREATE POLICY "news_views_modify_admin_only"
  ON public.news_views
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==============================================================================

-- Create buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('news-images', 'news-images', true),
  ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Drop old storage policies for these buckets
DROP POLICY IF EXISTS "news_images_storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "news_images_storage_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "news_images_storage_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "news_images_storage_admin_delete" ON storage.objects;

DROP POLICY IF EXISTS "user_avatars_storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_storage_user_insert" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_storage_user_update" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_storage_user_delete" ON storage.objects;

-- 7.1 news-images STORAGE POLICIES
-- Public read
CREATE POLICY "news_images_storage_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'news-images');

-- Admin insert
CREATE POLICY "news_images_storage_admin_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'news-images'
    AND public.is_admin()
  );

-- Admin update
CREATE POLICY "news_images_storage_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'news-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'news-images'
    AND public.is_admin()
  );

-- Admin delete
CREATE POLICY "news_images_storage_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'news-images'
    AND public.is_admin()
  );

-- 7.2 user-avatars STORAGE POLICIES
-- Public read
CREATE POLICY "user_avatars_storage_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-avatars');

-- User insert into user-avatars/{user_id}/*
CREATE POLICY "user_avatars_storage_user_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

-- User update in user-avatars/{user_id}/*
CREATE POLICY "user_avatars_storage_user_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

-- User delete in user-avatars/{user_id}/*
CREATE POLICY "user_avatars_storage_user_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );
