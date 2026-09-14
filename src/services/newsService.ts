import { LOCATIONS_DATA } from '../constants/locations';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Article, Category, LocationData, ArticleImage, ArticleVideo } from '../types';
import type { DbCategory, DbNews, DbNewsImage, DbNewsVideo } from '../types/database';

// ─────────────────────────────────────────────────────────────────────────────
// DB → Article mapper
//
// Actual public.news columns:
//   id, slug, title_en, title_hi, summary_en, summary_hi,
//   content_en, content_hi, category_id, author_id,
//   published_at, created_at, updated_at, status,
//   is_trending, is_featured, state, city, featured_image
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200';

export const mapDbRowToArticle = (
  row: DbNews | Record<string, unknown>,
  categoryMap?: Map<string, { nameEn: string; nameHi: string; slug: string }>,
  images?: ArticleImage[],
  videos?: ArticleVideo[],
  authorMap?: Map<string, { name: string; avatar?: string; role: string }>
): Article => {
  const r = row as Record<string, unknown>;

  // Category name resolution — prefer categoryMap lookup, fall back to 'General'
  let categoryNameEn = 'General';
  let categoryNameHi = 'सामान्य';
  if (categoryMap && r.category_id && categoryMap.has(r.category_id as string)) {
    const cat = categoryMap.get(r.category_id as string)!;
    categoryNameEn = cat.nameEn;
    categoryNameHi = cat.nameHi;
  }

  // Author resolution
  const rawAuthorId = (r.author_id as string | undefined) || undefined;
  let resolvedAuthorName = (r.author_name as string) || '';
  let resolvedAuthorAvatar = (r.author_avatar as string) || '';
  let resolvedAuthorRole = (r.author_role as string) || '';

  if (rawAuthorId && authorMap && authorMap.has(rawAuthorId)) {
    const a = authorMap.get(rawAuthorId)!;
    if (!resolvedAuthorName) resolvedAuthorName = a.name;
    if (!resolvedAuthorAvatar && a.avatar) resolvedAuthorAvatar = a.avatar;
    if (!resolvedAuthorRole) resolvedAuthorRole = a.role;
  }

  // If author_id exists but profile was not found / has no name, NEVER fallback to Editorial Desk!
  if (rawAuthorId) {
    if (!resolvedAuthorName) resolvedAuthorName = 'Author';
    if (!resolvedAuthorRole) resolvedAuthorRole = 'Staff Writer';
  } else {
    // Only when author_id is explicitly NULL / undefined:
    if (!resolvedAuthorName) resolvedAuthorName = 'Editorial Desk';
    if (!resolvedAuthorRole) resolvedAuthorRole = 'Chief Editor';
  }

  if (!resolvedAuthorAvatar) {
    resolvedAuthorAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      resolvedAuthorName
    )}`;
  }

  const rawImage = ((r.image_url as string) || (r.featured_image as string) || '').trim();

  return {
    id: (r.id as string) || '',
    slug: (r.slug as string) || '',

    titleEn: (r.title_en ?? '') as string,
    titleHi: (r.title_hi ?? r.title_en ?? '') as string,

    excerptEn: (r.summary_en ?? r.excerpt_en ?? '') as string,
    excerptHi: (r.summary_hi ?? r.excerpt_hi ?? r.summary_en ?? r.excerpt_en ?? '') as string,

    contentEn: (r.content_en ?? '') as string,
    contentHi: (r.content_hi ?? r.content_en ?? '') as string,

    categoryId: (r.category_id ?? '') as string,
    categoryNameEn,
    categoryNameHi,

    // authorId — UUID of the profile row for the author/writer; null when Editorial Desk
    authorId: rawAuthorId,

    author: {
      name: resolvedAuthorName,
      avatar: resolvedAuthorAvatar,
      role: resolvedAuthorRole,
    },

    publishedAt: (r.published_at ?? r.created_at ?? new Date().toISOString()) as string,
    status: ((r.status as string) === 'published' || (r.status as string) === 'active' || (r.status as string) === 'live'
      ? 'published'
      : (r.status as string) === 'archived'
        ? 'archived'
        : 'draft') as 'draft' | 'published' | 'archived',

    // Only substitute the default placeholder when both DB image columns are empty/null.
    // A real URL from either column takes priority — never overwrite it with the default.
    imageUrl: rawImage.length > 0 ? rawImage : DEFAULT_ARTICLE_IMAGE,

    imageCaption: (r.image_caption) as string | undefined,
    videoUrl: (r.video_url) as string | undefined,
    images: images ?? [],
    videos: videos ?? [],

    isBreaking: (r.is_breaking ?? false) as boolean,
    isTrending: (r.is_trending ?? false) as boolean,
    isFeatured: (r.is_featured ?? false) as boolean,

    state: r.state as string | undefined,
    city: r.city as string | undefined,

    readTimeMinutes: (r.read_time_minutes ?? 4) as number,
    viewsCount: (r.views_count ?? 0) as number,
    savesCount: (r.saves_count ?? 0) as number,
    tags: (r.tags ?? []) as string[],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AuthorProfile — lightweight profile used for author dropdowns
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthorProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: 'author' | 'writer';
}

/**
 * Fetch all profiles whose role is 'author' or 'writer'.
 * Used to populate the Author/Writer selector in ArticleUpload.
 */
export async function getArticleAuthors(): Promise<AuthorProfile[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .in('role', ['author', 'writer'])
    .order('full_name', { ascending: true });

  if (error) {
    console.error('[newsService] getArticleAuthors error:', error);
    return [];
  }

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    fullName: (p.full_name as string) || 'Unnamed',
    avatarUrl: p.avatar_url as string | undefined,
    role: p.role as 'author' | 'writer',
  }));
}



export const newsService = {
  // ── 1. GET ARTICLES (Public / Filtered) ─────────────────────────────────
  async getArticles(params?: {
    categorySlug?: string;
    categoryId?: string;
    authorId?: string;
    state?: string;
    city?: string;
    searchQuery?: string;
    isBreaking?: boolean;
    isTrending?: boolean;
    isFeatured?: boolean;
    limit?: number;
    offset?: number;
    includeDrafts?: boolean;
  }): Promise<Article[]> {
    if (!isSupabaseConfigured()) {
      console.warn('[newsService] Supabase is not configured.');
      return [];
    }

    try {
      // Build category resolution map.
      // IMPORTANT: If this query returns a 401/403, the Supabase `anon` role
      // is missing a SELECT policy on public.categories. Fix in Supabase Dashboard:
      //   ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
      //   CREATE POLICY "categories_public_read" ON public.categories
      //     FOR SELECT TO anon, authenticated USING (true);
      const { data: catRows, error: catErr } = await supabase
        .from('categories')
        .select('id, slug, name_en, name_hi');
      if (catErr) {
        console.error(
          '[newsService] getArticles — categories fetch failed.',
          'HTTP status:', catErr.code,
          'Message:', catErr.message,
          'Details:', catErr.details,
          '\nFix: grant SELECT on public.categories to anon role via Supabase RLS policy.'
        );
      }
      const catMap = new Map<string, { nameEn: string; nameHi: string; slug: string }>();
      (catRows as Pick<DbCategory, 'id' | 'slug' | 'name_en' | 'name_hi'>[] | null)
        ?.forEach((c) => catMap.set(c.id, { nameEn: c.name_en, nameHi: c.name_hi, slug: c.slug }));

      let query = supabase.from('news').select(
        'id, slug, title_en, title_hi, summary_en, summary_hi, ' +
        'content_en, content_hi, category_id, author_id, ' +
        'published_at, created_at, updated_at, status, ' +
        'is_trending, is_featured, state, city, image_url, featured_image'
      );

      // Published filter
      if (!params?.includeDrafts) {
        query = query.eq('status', 'published');
      }

      // Author filter
      if (params?.authorId) {
        query = query.eq('author_id', params.authorId);
      }

      // Category filter
      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
      } else if (params?.categorySlug) {
        const matchedCatId = Array.from(catMap.entries()).find(
          ([, v]) => v.slug.toLowerCase() === params.categorySlug!.toLowerCase()
        )?.[0];
        if (matchedCatId) {
          query = query.eq('category_id', matchedCatId);
        } else {
          return [];
        }
      }

      // Location filters
      if (params?.state) query = query.ilike('state', `%${params.state}%`);
      if (params?.city)  query = query.ilike('city', `%${params.city}%`);

      // Feature flags
      if (params?.isTrending !== undefined) query = query.eq('is_trending', params.isTrending);
      if (params?.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);

      // Full-text search across bilingual title + summary + content
      if (params?.searchQuery) {
        const q = params.searchQuery.trim();
        query = query.or(
          `title_en.ilike.%${q}%,title_hi.ilike.%${q}%,` +
          `summary_en.ilike.%${q}%,summary_hi.ilike.%${q}%,` +
          `content_en.ilike.%${q}%,content_hi.ilike.%${q}%`
        );
      }

      query = query.order('published_at', { ascending: false });

      if (params?.limit) {
        const from = params.offset || 0;
        query = query.range(from, from + params.limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[newsService] getArticles DB error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Batch resolve author profiles for all author_ids in this result set
      const authorIds = Array.from(
        new Set(
          (data as unknown as Record<string, unknown>[])
            .map((r) => r.author_id as string)
            .filter(Boolean)
        )
      );

      const authorMap = new Map<string, { name: string; avatar?: string; role: string }>();
      if (authorIds.length > 0) {
        try {
          const { data: profileRows, error: profileErr } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', authorIds);

          if (!profileErr && profileRows) {
            profileRows.forEach((p: Record<string, unknown>) => {
              const pRole = (p.role as string)?.toLowerCase();
              const roleLabel =
                pRole === 'author'
                  ? 'Author'
                  : pRole === 'writer'
                  ? 'Writer'
                  : pRole === 'admin'
                  ? 'Chief Editor'
                  : 'Staff Writer';

              authorMap.set(p.id as string, {
                name: (p.full_name as string) || 'Author',
                avatar: (p.avatar_url as string) || undefined,
                role: roleLabel,
              });
            });
          } else if (profileErr) {
            console.warn('[newsService] Batch author profiles query notice:', profileErr.message);
          }
        } catch (err) {
          console.warn('[newsService] Author profile batch fetch warning:', err);
        }
      }

      return (data as unknown as DbNews[]).map((row) =>
        mapDbRowToArticle(row, catMap, undefined, undefined, authorMap)
      );
    } catch (err) {
      console.error('[newsService] getArticles exception:', err);
      return [];
    }
  },

  // ── 2. GET ARTICLE BY SLUG ───────────────────────────────────────────────
  async getArticleBySlug(slug: string): Promise<Article | null> {
    if (!isSupabaseConfigured()) {
      console.warn('[newsService] Supabase is not configured.');
      return null;
    }

    try {
      const { data: newsRow, error: newsErr } = await supabase
        .from('news')
        .select(
          'id, slug, title_en, title_hi, summary_en, summary_hi, ' +
          'content_en, content_hi, category_id, author_id, ' +
          'published_at, created_at, updated_at, status, ' +
          'is_trending, is_featured, state, city, image_url, featured_image'
        )
        .eq('slug', slug)
        .single();

      if (newsErr) {
        if (newsErr.code !== 'PGRST116') {
          console.error('[newsService] getArticleBySlug error:', newsErr);
        }
        return null;
      }

      if (!newsRow) return null;

      const r = newsRow as unknown as Record<string, unknown>;

      // Resolve category name
      let categoryNameEn = 'General';
      let categoryNameHi = 'सामान्य';
      if (r.category_id) {
        const { data: catData } = await supabase
          .from('categories')
          .select('name_en, name_hi')
          .eq('id', r.category_id as string)
          .single();
        if (catData) {
          categoryNameEn = (catData as Pick<DbCategory, 'name_en' | 'name_hi'>).name_en;
          categoryNameHi = (catData as Pick<DbCategory, 'name_en' | 'name_hi'>).name_hi;
        }
      }

      // Fetch gallery images
      const articleImages: ArticleImage[] = [];
      try {
        const { data: imgRows } = await supabase
          .from('news_images')
          .select('id, image_url, caption_en, caption_hi')
          .eq('news_id', r.id as string)
          .order('display_order', { ascending: true });
        if (imgRows) {
          articleImages.push(
            ...(imgRows as Pick<DbNewsImage, 'id' | 'image_url' | 'caption_en' | 'caption_hi'>[])
              .map((img) => ({
                id: img.id,
                imageUrl: img.image_url,
                captionEn: img.caption_en ?? undefined,
                captionHi: img.caption_hi ?? undefined,
              }))
          );
        }
      } catch {
        // news_images table optional
      }

      // Fetch videos
      const articleVideos: ArticleVideo[] = [];
      try {
        const { data: vidRows } = await supabase
          .from('news_videos')
          .select('id, video_url, title_en, title_hi')
          .eq('news_id', r.id as string)
          .order('display_order', { ascending: true });
        if (vidRows) {
          articleVideos.push(
            ...(vidRows as Pick<DbNewsVideo, 'id' | 'video_url' | 'title_en' | 'title_hi'>[])
              .map((vid) => ({
                id: vid.id,
                videoUrl: vid.video_url,
                titleEn: vid.title_en ?? undefined,
                titleHi: vid.title_hi ?? undefined,
              }))
          );
        }
      } catch {
        // news_videos table optional
      }

      // Resolve author details from public.profiles if author_id is set
      const enrichedRow: Record<string, unknown> = { ...(newsRow as unknown as Record<string, unknown>) };
      if (enrichedRow.author_id) {
        try {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .eq('id', enrichedRow.author_id as string)
            .single();

          if (!profileErr && profileData) {
            const pd = profileData as { full_name?: string; avatar_url?: string; role?: string };
            const pRole = (pd.role as string)?.toLowerCase();
            const roleLabel =
              pRole === 'author'
                ? 'Author'
                : pRole === 'writer'
                ? 'Writer'
                : pRole === 'admin'
                ? 'Chief Editor'
                : 'Staff Writer';

            enrichedRow.author_name = pd.full_name || 'Author';
            enrichedRow.author_avatar = pd.avatar_url || null;
            enrichedRow.author_role = roleLabel;
          } else if (profileErr) {
            console.warn('[newsService] getArticleBySlug author profile fetch notice:', profileErr.message);
          }
        } catch (err) {
          console.warn('[newsService] getArticleBySlug author profile lookup error:', err);
        }
      }

      const art = mapDbRowToArticle(enrichedRow as unknown as DbNews, undefined, articleImages, articleVideos);
      art.categoryNameEn = categoryNameEn;
      art.categoryNameHi = categoryNameHi;
      return art;
    } catch (err) {
      console.error('[newsService] getArticleBySlug exception:', err);
      return null;
    }
  },

  // ── 3. SHORTCUT ACCESSORS ────────────────────────────────────────────────
  async getBreakingArticles(): Promise<Article[]> {
    return this.getArticles({ isFeatured: true, limit: 5 });
  },

  async getTrendingArticles(): Promise<Article[]> {
    return this.getArticles({ isTrending: true, limit: 6 });
  },

  async getFeaturedArticles(): Promise<Article[]> {
    return this.getArticles({ isFeatured: true, limit: 3 });
  },

  // ── 4. CATEGORIES CRUD ───────────────────────────────────────────────────
  async getCategories(includeInactive = false): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      console.warn('[newsService] Supabase is not configured.');
      return [];
    }

    try {
      let query = supabase
        .from('categories')
        .select('id, slug, name_en, name_hi, description_en, description_hi, is_active, display_order');

      if (!includeInactive) {
        query = query.or('is_active.eq.true,is_active.is.null');
      }

      const { data, error } = await query.order('name_en', { ascending: true });

      if (error) {
        console.warn('[newsService] getCategories main query notice, attempting fallback select:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('categories')
          .select('id, slug, name_en, name_hi');

        if (fallbackError) {
          console.error('[newsService] getCategories fallback error:', fallbackError);
          return [];
        }

        if (!fallbackData) return [];

        return (fallbackData as Pick<DbCategory, 'id' | 'slug' | 'name_en' | 'name_hi'>[]).map((c) => ({
          id: c.id,
          slug: c.slug,
          nameEn: c.name_en,
          nameHi: c.name_hi || c.name_en,
          isActive: true,
        }));
      }

      if (!data) return [];

      return (data as DbCategory[]).map((c) => ({
        id: c.id,
        slug: c.slug,
        nameEn: c.name_en,
        nameHi: c.name_hi || c.name_en,
        descriptionEn: c.description_en ?? undefined,
        descriptionHi: c.description_hi ?? undefined,
        isActive: c.is_active ?? true,
      }));
    } catch (err) {
      console.error('[newsService] getCategories exception:', err);
      return [];
    }
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    // 1. Verify currently authenticated Supabase user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error(`Authentication required: ${userError?.message || 'No active user session'}`);
    }

    // 2. Verify user's public.profiles.role is "admin"
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to verify admin privileges: ${profileError.message}`);
    }

    if (profile?.role !== 'admin') {
      throw new Error('Access denied: Administrator role required in public.profiles to create categories.');
    }

    // 3. Perform category insert with authenticated client
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        slug: cat.slug,
        name_en: cat.nameEn,
        name_hi: cat.nameHi,
        description_en: cat.descriptionEn || null,
        description_hi: cat.descriptionHi || null,
        is_active: cat.isActive ?? true,
      }])
      .select()
      .single();

    if (error) {
      console.error('[newsService] createCategory error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Category created but no record returned from database.');
    }

    const created: Category = {
      id: (data as DbCategory).id,
      slug: (data as DbCategory).slug,
      nameEn: (data as DbCategory).name_en,
      nameHi: (data as DbCategory).name_hi,
      descriptionEn: (data as DbCategory).description_en ?? undefined,
      descriptionHi: (data as DbCategory).description_hi ?? undefined,
      isActive: (data as DbCategory).is_active,
    };
    return created;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    // 1. Verify currently authenticated Supabase user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error(`Authentication required: ${userError?.message || 'No active user session'}`);
    }

    // 2. Verify user's public.profiles.role is "admin"
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to verify admin privileges: ${profileError.message}`);
    }

    if (profile?.role !== 'admin') {
      throw new Error('Access denied: Administrator role required in public.profiles to delete categories.');
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('[newsService] deleteCategory error:', error);
      throw error;
    }
    return true;
  },

  // ── 5. LOCATIONS DATA ────────────────────────────────────────────────────
  async getLocations(): Promise<LocationData[]> {
    return LOCATIONS_DATA;
  },

  // ── 6. CREATE NEWS ARTICLE (Admin) ───────────────────────────────────────
  async createArticle(
    newArticleData: Omit<Article, 'id' | 'viewsCount' | 'savesCount'>,
    authorId?: string
  ): Promise<Article | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const resolvedAuthorId =
      newArticleData.authorId !== undefined
        ? newArticleData.authorId
        : (authorId || null);

    const dbPayload: Record<string, unknown> = {
      slug: newArticleData.slug,
      title_en: newArticleData.titleEn,
      title_hi: newArticleData.titleHi || null,
      summary_en: newArticleData.excerptEn || null,
      summary_hi: newArticleData.excerptHi || null,
      content_en: newArticleData.contentEn || null,
      content_hi: newArticleData.contentHi || null,
      category_id: newArticleData.categoryId || null,
      author_id: resolvedAuthorId || null,
      published_at: newArticleData.publishedAt || new Date().toISOString(),
      status: newArticleData.status || 'published',
      is_trending: newArticleData.isTrending ?? false,
      is_featured: newArticleData.isFeatured ?? false,
      // Write to both columns so existing queries that read either one always get the URL
      image_url: newArticleData.imageUrl || null,
      featured_image: newArticleData.imageUrl || null,
      state: newArticleData.state || null,
      city: newArticleData.city || null,
    };

    const { data, error } = await supabase
      .from('news')
      .insert([dbPayload])
      .select()
      .single();

    if (error || !data) {
      console.error('[newsService] createArticle insert error:', error);
      throw error || new Error('Failed to insert news article');
    }

    // Save gallery images if provided
    if (newArticleData.images?.length) {
      try {
        await supabase.from('news_images').insert(
          newArticleData.images.map((img, idx) => ({
            news_id: (data as Record<string, unknown>).id,
            image_url: img.imageUrl,
            caption_en: img.captionEn || null,
            caption_hi: img.captionHi || null,
            display_order: idx,
          }))
        );
      } catch (imgErr) {
        console.warn('[newsService] news_images insert warning:', imgErr);
      }
    }

    // Save videos if provided
    if (newArticleData.videos?.length) {
      try {
        await supabase.from('news_videos').insert(
          newArticleData.videos.map((vid, idx) => ({
            news_id: (data as Record<string, unknown>).id,
            video_url: vid.videoUrl,
            title_en: vid.titleEn || null,
            title_hi: vid.titleHi || null,
            display_order: idx,
          }))
        );
      } catch (vidErr) {
        console.warn('[newsService] news_videos insert warning:', vidErr);
      }
    }

    return mapDbRowToArticle(data as DbNews);
  },

  // ── 7. UPDATE NEWS ARTICLE (Admin) ───────────────────────────────────────
  async updateArticle(id: string, updates: Partial<Article>): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.titleEn !== undefined)   dbUpdates.title_en    = updates.titleEn;
    if (updates.titleHi !== undefined)   dbUpdates.title_hi    = updates.titleHi;
    if (updates.excerptEn !== undefined) dbUpdates.summary_en  = updates.excerptEn;
    if (updates.excerptHi !== undefined) dbUpdates.summary_hi  = updates.excerptHi;
    if (updates.contentEn !== undefined) dbUpdates.content_en  = updates.contentEn;
    if (updates.contentHi !== undefined) dbUpdates.content_hi  = updates.contentHi;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
    if (updates.imageUrl !== undefined) {
      dbUpdates.image_url = updates.imageUrl || null;
      dbUpdates.featured_image = updates.imageUrl || null;
    }
    if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
    if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
    if (updates.state !== undefined)     dbUpdates.state       = updates.state;
    if (updates.city !== undefined)      dbUpdates.city        = updates.city;
    if (updates.status !== undefined)    dbUpdates.status      = updates.status;

    const { error } = await supabase.from('news').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('[newsService] updateArticle error:', error);
      return false;
    }
    return true;
  },

  // ── 8. DELETE NEWS ARTICLE (Admin) ───────────────────────────────────────
  async deleteArticle(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) {
      console.error('[newsService] deleteArticle error:', error);
      return false;
    }
    return true;
  },

  // ── 9. UPLOAD NEWS IMAGE TO STORAGE ──────────────────────────────────────
  async uploadNewsImage(file: File): Promise<{ url: string | null; error: unknown }> {
    if (!file.type.startsWith('image/')) {
      return { url: null, error: new Error('Invalid image file type') };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { url: null, error: new Error('File size exceeds 10MB limit') };
    }

    if (!isSupabaseConfigured()) {
      return { url: null, error: new Error('Supabase Storage is not configured.') };
    }

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `articles/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('news-images')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        console.error('[newsService] uploadNewsImage error:', uploadErr);
        return { url: null, error: uploadErr };
      }

      const { data } = supabase.storage.from('news-images').getPublicUrl(filePath);
      return { url: data.publicUrl, error: null };
    } catch (err) {
      console.error('[newsService] uploadNewsImage exception:', err);
      return { url: null, error: err };
    }
  },

  // ── 10. RECORD VIEW FOR ANALYTICS ────────────────────────────────────────
  async recordView(newsId: string, userId?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase.from('news_views').insert([{
        news_id: newsId,
        user_id: userId ?? null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }]);
    } catch (err) {
      console.warn('[newsService] recordView error:', err);
    }
  },
};
