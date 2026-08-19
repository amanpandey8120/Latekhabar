/**
 * database.ts — Typed schema for all Supabase public tables.
 *
 * Column names match the actual PostgreSQL snake_case column names.
 * Use these types in service-layer queries to avoid `any` casts.
 *
 * Usage:
 *   import type { DbProfile, DbNews, DbBookmark, DbNewsView } from '../types/database';
 */

// ── public.profiles ───────────────────────────────────────────────────────────
export interface DbProfile {
  id: string;                   // uuid — equals auth.uid()
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';      // never writable from the frontend
  language: 'en' | 'hi' | null;
  state: string | null;
  city: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Columns an authenticated user is permitted to update via RLS */
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
export interface DbNews {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string | null;
  excerpt_en: string | null;
  excerpt_hi: string | null;
  content_en: string | null;
  content_hi: string | null;
  category_id: string | null;
  category_slug: string | null;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  author_role: string | null;
  published_at: string;
  status: 'draft' | 'published' | 'archived';
  is_published: boolean;
  is_breaking: boolean;
  is_trending: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_caption: string | null;
  video_url: string | null;
  state: string | null;
  city: string | null;
  read_time_minutes: number;
  views_count: number;
  saves_count: number;
  tags: string[];
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
  user_id: string;   // auth.uid() — enforced by RLS
  news_id: string;
  created_at: string;
}

/** Shape returned when joining bookmarks → news */
export interface DbBookmarkWithNews extends DbBookmark {
  news: DbNews | null;
}

// ── public.news_views ─────────────────────────────────────────────────────────
export interface DbNewsView {
  id: string;
  news_id: string;
  user_id: string | null;   // null for anonymous views
  user_agent: string | null;
  viewed_at: string;
}
