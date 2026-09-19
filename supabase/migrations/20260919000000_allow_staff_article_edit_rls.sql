-- ==============================================================================
-- Late Khabar - Update News RLS Policy to allow Staff (Author / Writer) Editing
-- Migration: 20260919000000_allow_staff_article_edit_rls.sql
-- ==============================================================================

-- Drop old admin-only update policy
DROP POLICY IF EXISTS "news_update_admin_only" ON public.news;
DROP POLICY IF EXISTS "news_update_staff" ON public.news;

-- Helper to check if current user is an author or writer
CREATE OR REPLACE FUNCTION public.is_author_or_writer()
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
      AND role IN ('author', 'writer')
  );
$$;

-- UPDATE: Admins can update any article.
-- Authors/Writers can update articles where author_id = auth.uid()
-- WITH CHECK ensures authors/writers cannot transfer ownership or change author_id to another user.
CREATE POLICY "news_update_staff"
  ON public.news
  FOR UPDATE
  USING (
    public.is_admin()
    OR (
      public.is_author_or_writer()
      AND author_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_author_or_writer()
      AND author_id = auth.uid()
    )
  );

-- Also ensure INSERT policy allows authors and writers to create news with their own author_id
DROP POLICY IF EXISTS "news_insert_admin_only" ON public.news;
DROP POLICY IF EXISTS "news_insert_staff" ON public.news;

CREATE POLICY "news_insert_staff"
  ON public.news
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_author_or_writer()
      AND (author_id = auth.uid() OR author_id IS NULL)
    )
  );
