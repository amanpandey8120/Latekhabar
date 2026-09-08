/**
 * bookmarkService.ts
 *
 * All bookmark operations against public.bookmarks.
 * RLS on the table enforces user_id = auth.uid() — the frontend never
 * passes a user_id parameter; Supabase resolves it from the session.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Article } from '../types';
import type { DbBookmark } from '../types/database';
import { mapDbRowToArticle } from './newsService';

// ── 1. Load bookmark IDs for the current authenticated user ──────────────────
export async function loadBookmarkIds(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('news_id');

  if (error) {
    console.warn('bookmarkService.loadBookmarkIds error:', error);
    return [];
  }

  return (data as Pick<DbBookmark, 'news_id'>[]).map((b) => b.news_id);
}

// ── 2. Load full article objects for the current user's bookmarks ────────────
export async function loadBookmarkedArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  // Fetch category map for name resolution
  const { data: catRows } = await supabase
    .from('categories')
    .select('id, slug, name_en, name_hi');

  const catMap = new Map<string, { nameEn: string; nameHi: string; slug: string }>();
  catRows?.forEach((c) => {
    catMap.set(c.id, { nameEn: c.name_en, nameHi: c.name_hi, slug: c.slug });
  });

  // Join bookmarks → news in one query; RLS ensures only the current user's rows are returned
  const { data, error } = await supabase
    .from('bookmarks')
    .select('news_id, news:news_id(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('bookmarkService.loadBookmarkedArticles error:', error);
    return [];
  }

  const articles: Article[] = [];
  for (const row of data ?? []) {
    const newsRow = (row as unknown as { news_id: string; news: Record<string, unknown> | Record<string, unknown>[] | null }).news;
    // Supabase may return the joined row as an object or single-element array
    const article = Array.isArray(newsRow) ? newsRow[0] : newsRow;
    if (article) {
      articles.push(mapDbRowToArticle(article, catMap));
    }
  }
  return articles;
}

// ── 3. Add a bookmark ────────────────────────────────────────────────────────
export async function addBookmark(newsId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert([{ news_id: newsId }]);

  if (error) {
    // Ignore unique-constraint violations (already bookmarked)
    if (error.code === '23505') return true;
    console.warn('bookmarkService.addBookmark error:', error);
    return false;
  }
  return true;
}

// ── 4. Remove a bookmark ─────────────────────────────────────────────────────
export async function removeBookmark(newsId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('news_id', newsId);

  if (error) {
    console.warn('bookmarkService.removeBookmark error:', error);
    return false;
  }
  return true;
}

// ── 5. Toggle helper (add if not present, remove if present) ─────────────────
export async function toggleBookmark(
  newsId: string,
  currentlySaved: boolean
): Promise<boolean> {
  return currentlySaved ? removeBookmark(newsId) : addBookmark(newsId);
}
