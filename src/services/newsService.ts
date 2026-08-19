import { INITIAL_ARTICLES, INITIAL_CATEGORIES, LOCATIONS_DATA } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Article, Category, LocationData, ArticleImage, ArticleVideo } from '../types';
import type { DbCategory, DbNews, DbNewsImage, DbNewsVideo } from '../types/database';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback stores (used when Supabase is not configured or errors)
// ─────────────────────────────────────────────────────────────────────────────
let localArticlesStore = [...INITIAL_ARTICLES];
let localCategoriesStore = [...INITIAL_CATEGORIES];

// ─────────────────────────────────────────────────────────────────────────────
// DB → Article mapper
//
// Actual public.news columns (verified against live DB):
//   id, slug, title_en, title_hi, summary_en, summary_hi,
//   content_en, content_hi, category_id, author_id,
//   published_at, created_at, updated_at, status,
//   is_trending, is_featured, state, city, featured_image
//
// Columns that do NOT exist (removed from all queries):
//   is_published, is_breaking, excerpt_en, excerpt_hi,
//   image_url, image_caption, video_url, tags,
//   author_name, author_avatar, author_role, category_slug,
//   read_time_minutes, views_count, saves_count
// ─────────────────────────────────────────────────────────────────────────────
export const mapDbRowToArticle = (
  row: DbNews | Record<string, unknown>,
  categoryMap?: Map<string, { nameEn: string; nameHi: string; slug: string }>,
  images?: ArticleImage[],
  videos?: ArticleVideo[]
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

  return {
    id: r.id as string,
    slug: r.slug as string,

    titleEn: (r.title_en ?? '') as string,
    titleHi: (r.title_hi ?? r.title_en ?? '') as string,

    // DB uses summary_en / summary_hi — fallback to excerpt_* for mock data
    excerptEn: (r.summary_en ?? r.excerpt_en ?? '') as string,
    excerptHi: (r.summary_hi ?? r.excerpt_hi ?? r.summary_en ?? r.excerpt_en ?? '') as string,

    contentEn: (r.content_en ?? '') as string,
    contentHi: (r.content_hi ?? r.content_en ?? '') as string,

    categoryId: (r.category_id ?? '') as string,
    categoryNameEn,
    categoryNameHi,

    author: {
      // DB only has author_id; name/avatar not stored on news rows
      // Use a sensible default — admin can join profiles separately if needed
      name: 'Editorial Desk',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      role: 'Reporter',
    },

    publishedAt: (r.published_at ?? r.created_at ?? new Date().toISOString()) as string,
    status: ((r.status as string) === 'published' || (r.status as string) === 'active' || (r.status as string) === 'live'
      ? 'published'
      : (r.status as string) === 'archived'
        ? 'archived'
        : 'draft') as 'draft' | 'published' | 'archived',

    // DB column is featured_image (not image_url) — fallback to imageUrl for mock data
    imageUrl: (r.featured_image ?? r.image_url ??
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200') as string,

    // These columns don't exist in DB — always use safe defaults
    imageCaption: (r.image_caption) as string | undefined,
    videoUrl: (r.video_url) as string | undefined,
    images: images ?? [],
    videos: videos ?? [],

    // is_breaking does not exist in DB — treat status='breaking' if ever added,
    // or derive from a future column. For now always false from DB.
    isBreaking: (r.is_breaking ?? false) as boolean,
    isTrending: (r.is_trending ?? false) as boolean,
    isFeatured: (r.is_featured ?? false) as boolean,

    state: r.state as string | undefined,
    city: r.city as string | undefined,

    // These columns don't exist in DB — use safe defaults
    readTimeMinutes: (r.read_time_minutes ?? 4) as number,
    viewsCount: (r.views_count ?? 0) as number,
    savesCount: (r.saves_count ?? 0) as number,
    tags: (r.tags ?? []) as string[],
  };
};

export const newsService = {

  // ── 1. GET ARTICLES (Public / Filtered) ─────────────────────────────────
  async getArticles(params?: {
    categorySlug?: string;
    categoryId?: string;
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
    if (isSupabaseConfigured()) {
      try {
        // Build category resolution map first
        const { data: catRows } = await supabase
          .from('categories')
          .select('id, slug, name_en, name_hi');
        const catMap = new Map<string, { nameEn: string; nameHi: string; slug: string }>();
        (catRows as Pick<DbCategory, 'id' | 'slug' | 'name_en' | 'name_hi'>[] | null)
          ?.forEach((c) => catMap.set(c.id, { nameEn: c.name_en, nameHi: c.name_hi, slug: c.slug }));

        // Only select columns that actually exist in public.news
        let query = supabase.from('news').select(
          'id, slug, title_en, title_hi, summary_en, summary_hi, ' +
          'content_en, content_hi, category_id, author_id, ' +
          'published_at, created_at, updated_at, status, ' +
          'is_trending, is_featured, state, city, featured_image'
        );

        // Published filter: use status only — is_published column does not exist
        if (!params?.includeDrafts) {
          query = query.eq('status', 'published');
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
          }
          // If category not found in map, query returns 0 rows (no 400 error)
        }

        // Location filters
        if (params?.state) query = query.ilike('state', `%${params.state}%`);
        if (params?.city)  query = query.ilike('city', `%${params.city}%`);

        // Feature flags that actually exist in DB
        // is_breaking does NOT exist — skip silently; isBreaking param returns empty from DB
        if (params?.isTrending !== undefined) query = query.eq('is_trending', params.isTrending);
        if (params?.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);

        // Full-text search across bilingual title + content columns that exist
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
          console.error('[newsService] getArticles DB error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
        } else if (data && data.length > 0) {
          return (data as unknown as DbNews[]).map((row) => mapDbRowToArticle(row, catMap));
        }
      } catch (err) {
        console.warn('[newsService] getArticles exception, falling back to mock:', err);
      }
    }

    // ── Mock fallback ──────────────────────────────────────────────────────
    let results = [...localArticlesStore];
    if (params?.categorySlug) {
      const cat = localCategoriesStore.find(
        (c) => c.slug.toLowerCase() === params.categorySlug!.toLowerCase()
      );
      if (cat) results = results.filter((a) => a.categoryId === cat.id);
    }
    if (params?.categoryId)  results = results.filter((a) => a.categoryId === params.categoryId);
    if (params?.state)       results = results.filter((a) => a.state?.toLowerCase() === params.state!.toLowerCase());
    if (params?.city)        results = results.filter((a) => a.city?.toLowerCase() === params.city!.toLowerCase());
    if (params?.isBreaking !== undefined) results = results.filter((a) => a.isBreaking === params.isBreaking);
    if (params?.isTrending !== undefined) results = results.filter((a) => a.isTrending === params.isTrending);
    if (params?.isFeatured !== undefined) results = results.filter((a) => a.isFeatured === params.isFeatured);
    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      results = results.filter((a) =>
        a.titleEn.toLowerCase().includes(q) ||
        a.titleHi.toLowerCase().includes(q) ||
        a.excerptEn.toLowerCase().includes(q) ||
        a.excerptHi.toLowerCase().includes(q) ||
        a.contentEn.toLowerCase().includes(q) ||
        a.contentHi.toLowerCase().includes(q)
      );
    }
    if (params?.limit) {
      results = results.slice(params.offset || 0, (params.offset || 0) + params.limit);
    }
    return results;
  },

  // ── 2. GET ARTICLE BY SLUG ───────────────────────────────────────────────
  async getArticleBySlug(slug: string): Promise<Article | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: newsRow, error: newsErr } = await supabase
          .from('news')
          .select(
            'id, slug, title_en, title_hi, summary_en, summary_hi, ' +
            'content_en, content_hi, category_id, author_id, ' +
            'published_at, created_at, updated_at, status, ' +
            'is_trending, is_featured, state, city, featured_image'
          )
          .eq('slug', slug)
          .single();

        if (newsErr) {
          if (newsErr.code !== 'PGRST116') {
            console.error('[newsService] getArticleBySlug error:', newsErr);
          }
        } else if (newsRow) {
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

          // Fetch gallery images (news_images table — may or may not exist)
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
          } catch { /* news_images table may not exist */ }

          // Fetch videos (news_videos table — may or may not exist)
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
          } catch { /* news_videos table may not exist */ }

          const art = mapDbRowToArticle(newsRow as unknown as DbNews, undefined, articleImages, articleVideos);
          art.categoryNameEn = categoryNameEn;
          art.categoryNameHi = categoryNameHi;
          return art;
        }
      } catch (err) {
        console.warn('[newsService] getArticleBySlug exception:', err);
      }
    }

    return localArticlesStore.find((a) => a.slug === slug || a.id === slug) || null;
  },

  // ── 3. SHORTCUT ACCESSORS ────────────────────────────────────────────────
  async getBreakingArticles(): Promise<Article[]> {
    // is_breaking does not exist in DB — return featured articles as "breaking"
    // so the home page hero still has content.
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
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('categories').select('*');
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error } = await query.order('display_order', { ascending: true });

        if (error) {
          console.error('[newsService] getCategories error:', error);
        } else if (data && data.length > 0) {
          return (data as DbCategory[]).map((c) => ({
            id: c.id,
            slug: c.slug,
            nameEn: c.name_en,
            nameHi: c.name_hi,
            descriptionEn: c.description_en ?? undefined,
            descriptionHi: c.description_hi ?? undefined,
            isActive: c.is_active,
          }));
        }
      } catch (err) {
        console.warn('[newsService] getCategories exception:', err);
      }
    }
    return localCategoriesStore;
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category | null> {
    if (isSupabaseConfigured()) {
      try {
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

        if (!error && data) {
          const created: Category = {
            id: (data as DbCategory).id,
            slug: (data as DbCategory).slug,
            nameEn: (data as DbCategory).name_en,
            nameHi: (data as DbCategory).name_hi,
            descriptionEn: (data as DbCategory).description_en ?? undefined,
            descriptionHi: (data as DbCategory).description_hi ?? undefined,
            isActive: (data as DbCategory).is_active,
          };
          localCategoriesStore.push(created);
          return created;
        }
      } catch (err) {
        console.warn('[newsService] createCategory error:', err);
      }
    }
    const mockCat: Category = { ...cat, id: `cat-${Date.now()}` };
    localCategoriesStore.push(mockCat);
    return mockCat;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) {
          localCategoriesStore = localCategoriesStore.filter((c) => c.id !== id);
          return true;
        }
      } catch (err) {
        console.warn('[newsService] deleteCategory error:', err);
      }
    }
    localCategoriesStore = localCategoriesStore.filter((c) => c.id !== id);
    return true;
  },

  // ── 5. LOCATIONS DATA ────────────────────────────────────────────────────
  async getLocations(): Promise<LocationData[]> {
    return LOCATIONS_DATA;
  },

  // ── 6. CREATE NEWS ARTICLE (Admin) ───────────────────────────────────────
  // Only inserts columns that actually exist in public.news
  async createArticle(
    newArticleData: Omit<Article, 'id' | 'viewsCount' | 'savesCount'>,
    authorId?: string
  ): Promise<Article> {
    if (isSupabaseConfigured()) {
      try {
        const dbPayload: Record<string, unknown> = {
          slug: newArticleData.slug,
          title_en: newArticleData.titleEn,
          title_hi: newArticleData.titleHi || null,
          // Map excerptEn/Hi to summary_en/hi (actual DB columns)
          summary_en: newArticleData.excerptEn || null,
          summary_hi: newArticleData.excerptHi || null,
          content_en: newArticleData.contentEn || null,
          content_hi: newArticleData.contentHi || null,
          category_id: newArticleData.categoryId && !newArticleData.categoryId.startsWith('cat-')
            ? newArticleData.categoryId
            : null,
          author_id: authorId || null,
          published_at: newArticleData.publishedAt || new Date().toISOString(),
          // Map to actual DB column name
          status: newArticleData.status || 'published',
          is_trending: newArticleData.isTrending ?? false,
          is_featured: newArticleData.isFeatured ?? false,
          // Map imageUrl to featured_image (actual DB column)
          featured_image: newArticleData.imageUrl || null,
          state: newArticleData.state || null,
          city: newArticleData.city || null,
        };

        const { data, error } = await supabase
          .from('news')
          .insert([dbPayload])
          .select()
          .single();

        if (!error && data) {
          // Save gallery images if news_images table exists
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
            } catch { /* news_images may not exist */ }
          }

          // Save videos if news_videos table exists
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
            } catch { /* news_videos may not exist */ }
          }

          const created = mapDbRowToArticle(data as DbNews);
          localArticlesStore = [created, ...localArticlesStore];
          return created;
        }

        if (error) console.warn('[newsService] createArticle insert error:', error);
      } catch (err) {
        console.warn('[newsService] createArticle exception:', err);
      }
    }

    const created: Article = {
      ...newArticleData,
      id: `art-${Date.now()}`,
      viewsCount: 0,
      savesCount: 0,
    };
    localArticlesStore = [created, ...localArticlesStore];
    return created;
  },

  // ── 7. UPDATE NEWS ARTICLE (Admin) ───────────────────────────────────────
  async updateArticle(id: string, updates: Partial<Article>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.titleEn !== undefined)   dbUpdates.title_en    = updates.titleEn;
        if (updates.titleHi !== undefined)   dbUpdates.title_hi    = updates.titleHi;
        // Map excerptEn/Hi to actual DB columns summary_en/hi
        if (updates.excerptEn !== undefined) dbUpdates.summary_en  = updates.excerptEn;
        if (updates.excerptHi !== undefined) dbUpdates.summary_hi  = updates.excerptHi;
        if (updates.contentEn !== undefined) dbUpdates.content_en  = updates.contentEn;
        if (updates.contentHi !== undefined) dbUpdates.content_hi  = updates.contentHi;
        // Map imageUrl to actual DB column featured_image
        if (updates.imageUrl !== undefined)  dbUpdates.featured_image = updates.imageUrl;
        // is_trending and is_featured exist; is_breaking does not
        if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
        if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
        if (updates.state !== undefined)     dbUpdates.state       = updates.state;
        if (updates.city !== undefined)      dbUpdates.city        = updates.city;
        if (updates.status !== undefined)    dbUpdates.status      = updates.status;

        const { error } = await supabase.from('news').update(dbUpdates).eq('id', id);
        if (!error) return true;
        console.warn('[newsService] updateArticle error:', error);
      } catch (err) {
        console.warn('[newsService] updateArticle exception:', err);
      }
    }
    localArticlesStore = localArticlesStore.map((a) => a.id === id ? { ...a, ...updates } : a);
    return true;
  },

  // ── 8. DELETE NEWS ARTICLE (Admin) ───────────────────────────────────────
  async deleteArticle(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) console.warn('[newsService] deleteArticle error:', error);
      } catch (err) {
        console.warn('[newsService] deleteArticle exception:', err);
      }
    }
    localArticlesStore = localArticlesStore.filter((a) => a.id !== id);
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

    if (isSupabaseConfigured()) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `articles/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('news-images')
          .upload(filePath, file, { upsert: true, contentType: file.type });

        if (!uploadErr) {
          const { data } = supabase.storage.from('news-images').getPublicUrl(filePath);
          return { url: data.publicUrl, error: null };
        }
        console.warn('[newsService] uploadNewsImage error:', uploadErr);
      } catch (err) {
        console.warn('[newsService] uploadNewsImage exception:', err);
      }
    }

    // Fallback data-URL preview
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, error: null };
  },

  // ── 10. RECORD VIEW FOR ANALYTICS ────────────────────────────────────────
  async recordView(newsId: string, userId?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('news_views').insert([{
          news_id: newsId,
          user_id: userId ?? null,
          user_agent: navigator.userAgent,
        }]);
      } catch (err) {
        console.warn('[newsService] recordView error:', err);
      }
    }
  },
};
