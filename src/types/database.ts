/**
 * database.ts — Typed schema matching the ACTUAL Supabase public tables.
 *
 * Column names are verified against the live DB via PostgREST queries.
 * Do NOT add columns that don't exist — they will cause HTTP 400 errors.
 */

// ── public.profiles ───────────────────────────────────────────────────────────
export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  language: 'en' | 'hi' | null;
  state: string | null;
  city: string | null;
  created_at: string;
  updated_at: string | null;
}

export type DbProfileUpdate = Pick<
  DbProfile,
  'full_name' | 'avatar_url' | 'language' | 'state' | 'city'
>;

// ── public.categories ─────────────────────────────────────────────────────────
export interface DbCategory {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en: string | null;
  description_hi: string | null;
  is_active: boolean;
  display_order: number | null;
}

// ── public.news ───────────────────────────────────────────────────────────────
// VERIFIED columns — tested against live DB. Do not add columns not listed here.
export interface DbNews {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string | null;
  // Excerpt/summary: actual DB columns are summary_en / summary_hi
  summary_en: string | null;
  summary_hi: string | null;
  content_en: string | null;
  content_hi: string | null;
  category_id: string | null;
  // Author details: only author_id exists in DB; name/avatar come from profiles join
  author_id: string | null;
  published_at: string;
  // status values in DB: 'published' | 'draft' | 'archived' | 'active' | 'live' | 'pending'
  status: string;
  // Feature flags that actually exist:
  is_trending: boolean;
  is_featured: boolean;
  // is_published does NOT exist — use status = 'published'
  // is_breaking does NOT exist in DB
  // Image: actual DB column is featured_image (not image_url)
  featured_image: string | null;
  // These do NOT exist in DB: video_url, image_caption, tags,
  //   author_name, author_avatar, author_role, category_slug,
  //   read_time_minutes, views_count, saves_count, is_breaking, is_published
  state: string | null;
  city: string | null;
  created_at: string;
  updated_at: string | null;
}

// ── public.news_images ────────────────────────────────────────────────────────
export interface DbNewsImage {
  id: string;
  news_id: string;
  image_url: string;
  caption_en: string | null;
  caption_hi: string | null;
  display_order: number;
}

// ── public.news_videos ────────────────────────────────────────────────────────
export interface DbNewsVideo {
  id: string;
  news_id: string;
  video_url: string;
  title_en: string | null;
  title_hi: string | null;
  display_order: number;
}

// ── public.bookmarks ──────────────────────────────────────────────────────────
export interface DbBookmark {
  id: string;
  user_id: string;
  news_id: string;
  created_at: string;
}

export interface DbBookmarkWithNews extends DbBookmark {
  news: DbNews | null;
}

// ── public.news_views ─────────────────────────────────────────────────────────
export interface DbNewsView {
  id: string;
  news_id: string;
  user_id: string | null;
  user_agent: string | null;
  viewed_at: string;
}
