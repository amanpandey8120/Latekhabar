import { INITIAL_ARTICLES, INITIAL_CATEGORIES, LOCATIONS_DATA } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Article, Category, LocationData, ArticleImage, ArticleVideo } from '../types';
import type { DbCategory, DbNews, DbNewsImage, DbNewsVideo } from '../types/database';

let localArticlesStore = [...INITIAL_ARTICLES];
let localCategoriesStore = [...INITIAL_CATEGORIES];

// Helper to convert database snake_case row to TypeScript Article interface
export const mapDbRowToArticle = (
  row: DbNews | Record<string, unknown>,
  categoryMap?: Map<string, { nameEn: string; nameHi: string; slug: string }>,
  images?: ArticleImage[],
  videos?: ArticleVideo[]
): Article => {
  const r = row as Record<string, unknown>;
  let categoryNameEn = (r.category_name_en ?? r.categoryNameEn ?? 'General') as string;
  let categoryNameHi = (r.category_name_hi ?? r.categoryNameHi ?? 'सामान्य') as string;

  if (categoryMap && r.category_id && categoryMap.has(r.category_id as string)) {
    const cat = categoryMap.get(r.category_id as string)!;
    categoryNameEn = cat.nameEn;
    categoryNameHi = cat.nameHi;
  }

  return {
    id: r.id as string,
    slug: r.slug as string,
    titleEn: (r.title_en ?? r.titleEn ?? '') as string,
    titleHi: (r.title_hi ?? r.titleHi ?? r.title_en ?? r.titleEn ?? '') as string,
    excerptEn: (r.excerpt_en ?? r.excerptEn ?? '') as string,
    excerptHi: (r.excerpt_hi ?? r.excerptHi ?? r.excerpt_en ?? r.excerptEn ?? '') as string,
    contentEn: (r.content_en ?? r.contentEn ?? '') as string,
    contentHi: (r.content_hi ?? r.contentHi ?? r.content_en ?? r.contentEn ?? '') as string,
    categoryId: (r.category_id ?? r.categoryId ?? '') as string,
    categoryNameEn,
    categoryNameHi,
    author: {
      name: (r.author_name ?? (r.author as { name?: string } | undefined)?.name ?? 'Editorial Desk') as string,
      avatar: (r.author_avatar ?? (r.author as { avatar?: string } | undefined)?.avatar ??
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200') as string,
      role: (r.author_role ?? (r.author as { role?: string } | undefined)?.role ?? 'Chief Editor') as string,
    },
    publishedAt: (r.published_at ?? r.publishedAt ?? new Date().toISOString()) as string,
    status: (r.status ?? 'published') as 'draft' | 'published' | 'archived',
    imageUrl: (r.image_url ?? r.imageUrl ??
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200') as string,
    imageCaption: (r.image_caption ?? r.imageCaption) as string | undefined,
    videoUrl: (r.video_url ?? r.videoUrl) as string | undefined,
    images: images ?? [],
    videos: videos ?? [],
    isBreaking: (r.is_breaking ?? r.isBreaking ?? false) as boolean,
    isTrending: (r.is_trending ?? r.isTrending ?? false) as boolean,
    isFeatured: (r.is_featured ?? r.isFeatured ?? false) as boolean,
    state: r.state as string | undefined,
    city: r.city as string | undefined,
    readTimeMinutes: (r.read_time_minutes ?? r.readTimeMinutes ?? 4) as number,
    viewsCount: (r.views_count ?? r.viewsCount ?? 0) as number,
    savesCount: (r.saves_count ?? r.savesCount ?? 0) as number,
    tags: (r.tags ?? []) as string[],
  };
};

export const newsService = {
  // ── 1. GET ARTICLES (Public / Filtered) ───────────────────────────────────
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
    includeDrafts?: boolean; // For admin portal
  }): Promise<Article[]> {
    if (isSupabaseConfigured()) {
      try {
        // Fetch categories first to build resolution map
        const { data: catRows } = await supabase
          .from('categories')
          .select('id, slug, name_en, name_hi');
        const catMap = new Map<string, { nameEn: string; nameHi: string; slug: string }>();
        (catRows as Pick<DbCategory, 'id' | 'slug' | 'name_en' | 'name_hi'>[] | null)?.forEach((c) => {
          catMap.set(c.id, { nameEn: c.name_en, nameHi: c.name_hi, slug: c.slug });
        });

        let query = supabase.from('news').select('*');

        // Unless explicitly requesting drafts as an admin, enforce published status
        if (!params?.includeDrafts) {
          query = query.eq('is_published', true).eq('status', 'published');
        }

        // Category filter (by ID or Slug)
        if (params?.categoryId) {
          query = query.eq('category_id', params.categoryId);
        } else if (params?.categorySlug) {
          // Find matching category ID from catMap or query category_slug
          const matchedCatId = Array.from(catMap.entries()).find(
            ([, v]) => v.slug.toLowerCase() === params.categorySlug!.toLowerCase()
          )?.[0];
          if (matchedCatId) {
            query = query.or(`category_id.eq.${matchedCatId},category_slug.eq.${params.categorySlug}`);
          } else {
            query = query.eq('category_slug', params.categorySlug);
          }
        }

        // Location filters
        if (params?.state) {
          query = query.ilike('state', `%${params.state}%`);
        }
        if (params?.city) {
          query = query.ilike('city', `%${params.city}%`);
        }

        // Feature flags
        if (params?.isBreaking !== undefined) {
          query = query.eq('is_breaking', params.isBreaking);
        }
        if (params?.isTrending !== undefined) {
          query = query.eq('is_trending', params.isTrending);
        }
        if (params?.isFeatured !== undefined) {
          query = query.eq('is_featured', params.isFeatured);
        }

        // Search query across English & Hindi headlines and content
        if (params?.searchQuery) {
          const q = params.searchQuery.trim();
          query = query.or(
            `title_en.ilike.%${q}%,title_hi.ilike.%${q}%,excerpt_en.ilike.%${q}%,excerpt_hi.ilike.%${q}%,content_en.ilike.%${q}%,content_hi.ilike.%${q}%`
          );
        }

        // Sorting
        query = query.order('published_at', { ascending: false });

        // Pagination
        if (params?.limit) {
          const from = params.offset || 0;
          const to = from + params.limit - 1;
          query = query.range(from, to);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return (data as DbNews[]).map((row) => mapDbRowToArticle(row, catMap));
        }
      } catch (err) {
        console.warn('Supabase news query exception, falling back to mock dataset', err);
      }
    }

    // Fallback mock filtering
    let results = [...localArticlesStore];
    if (params?.categorySlug) {
      const cat = localCategoriesStore.find(
        (c) => c.slug.toLowerCase() === params.categorySlug!.toLowerCase()
      );
      if (cat) {
        results = results.filter((a) => a.categoryId === cat.id);
      }
    }
    if (params?.categoryId) {
      results = results.filter((a) => a.categoryId === params.categoryId);
    }
    if (params?.state) {
      results = results.filter((a) => a.state?.toLowerCase() === params.state?.toLowerCase());
    }
    if (params?.city) {
      results = results.filter((a) => a.city?.toLowerCase() === params.city?.toLowerCase());
    }
    if (params?.isBreaking !== undefined) {
      results = results.filter((a) => a.isBreaking === params.isBreaking);
    }
    if (params?.isTrending !== undefined) {
      results = results.filter((a) => a.isTrending === params.isTrending);
    }
    if (params?.isFeatured !== undefined) {
      results = results.filter((a) => a.isFeatured === params.isFeatured);
    }
    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.titleEn.toLowerCase().includes(q) ||
          a.titleHi.toLowerCase().includes(q) ||
          a.excerptEn.toLowerCase().includes(q) ||
          a.excerptHi.toLowerCase().includes(q) ||
          a.contentEn.toLowerCase().includes(q) ||
          a.contentHi.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.limit) {
      results = results.slice(params.offset || 0, (params.offset || 0) + params.limit);
    }
    return results;
  },

  // ── 2. GET ARTICLE BY SLUG (With joined category, images & videos) ────────
  async getArticleBySlug(slug: string): Promise<Article | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: newsRow, error: newsErr } = await supabase
          .from('news')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!newsErr && newsRow) {
          // Resolve category
          let categoryNameEn = newsRow.category_slug || 'General';
          let categoryNameHi = 'सामान्य';
          if (newsRow.category_id) {
            const { data: catData } = await supabase
              .from('categories')
              .select('name_en, name_hi')
              .eq('id', newsRow.category_id)
              .single();
            if (catData) {
              categoryNameEn = (catData as Pick<DbCategory, 'name_en' | 'name_hi'>).name_en;
              categoryNameHi = (catData as Pick<DbCategory, 'name_en' | 'name_hi'>).name_hi;
            }
          }

          // Fetch associated images from news_images table
          const { data: imageRows } = await supabase
            .from('news_images')
            .select('id, image_url, caption_en, caption_hi')
            .eq('news_id', newsRow.id)
            .order('display_order', { ascending: true });

          const articleImages: ArticleImage[] = (
            (imageRows as Pick<DbNewsImage, 'id' | 'image_url' | 'caption_en' | 'caption_hi'>[] | null) ?? []
          ).map((img) => ({
            id: img.id,
            imageUrl: img.image_url,
            captionEn: img.caption_en ?? undefined,
            captionHi: img.caption_hi ?? undefined,
          }));

          // Fetch associated videos from news_videos table
          const { data: videoRows } = await supabase
            .from('news_videos')
            .select('id, video_url, title_en, title_hi')
            .eq('news_id', newsRow.id)
            .order('display_order', { ascending: true });

          const articleVideos: ArticleVideo[] = (
            (videoRows as Pick<DbNewsVideo, 'id' | 'video_url' | 'title_en' | 'title_hi'>[] | null) ?? []
          ).map((vid) => ({
            id: vid.id,
            videoUrl: vid.video_url,
            titleEn: vid.title_en ?? undefined,
            titleHi: vid.title_hi ?? undefined,
          }));

          const art = mapDbRowToArticle(newsRow, undefined, articleImages, articleVideos);
          art.categoryNameEn = categoryNameEn;
          art.categoryNameHi = categoryNameHi;
          return art;
        }
      } catch (err) {
        console.warn('Supabase article by slug error, checking local store', err);
      }
    }

    const found = localArticlesStore.find((a) => a.slug === slug || a.id === slug);
    return found || null;
  },

  // ── 3. SHORTCUT ACCESSORS ────────────────────────────────────────────────
  async getBreakingArticles(): Promise<Article[]> {
    return this.getArticles({ isBreaking: true, limit: 5 });
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
        if (!includeInactive) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query.order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
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
        console.warn('Supabase categories fetch exception', err);
      }
    }
    return localCategoriesStore;
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert([
            {
              slug: cat.slug,
              name_en: cat.nameEn,
              name_hi: cat.nameHi,
              description_en: cat.descriptionEn || null,
              description_hi: cat.descriptionHi || null,
              is_active: cat.isActive ?? true,
            },
          ])
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
        console.warn('Create category error', err);
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
        console.warn('Delete category error', err);
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
  async createArticle(
    newArticleData: Omit<Article, 'id' | 'viewsCount' | 'savesCount'>,
    authorId?: string
  ): Promise<Article> {
    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          slug: newArticleData.slug,
          title_en: newArticleData.titleEn,
          title_hi: newArticleData.titleHi,
          excerpt_en: newArticleData.excerptEn,
          excerpt_hi: newArticleData.excerptHi,
          content_en: newArticleData.contentEn,
          content_hi: newArticleData.contentHi,
          category_id: newArticleData.categoryId && newArticleData.categoryId.startsWith('cat-') ? null : newArticleData.categoryId || null,
          category_slug: newArticleData.categoryNameEn?.toLowerCase() || 'general',
          author_id: authorId || null,
          author_name: newArticleData.author.name,
          author_avatar: newArticleData.author.avatar,
          author_role: newArticleData.author.role,
          published_at: newArticleData.publishedAt || new Date().toISOString(),
          status: (newArticleData.status || 'published') as 'draft' | 'published' | 'archived',
          is_published: true,
          is_breaking: newArticleData.isBreaking || false,
          is_trending: newArticleData.isTrending || false,
          is_featured: newArticleData.isFeatured || false,
          image_url: newArticleData.imageUrl,
          image_caption: newArticleData.imageCaption || null,
          video_url: newArticleData.videoUrl || null,
          state: newArticleData.state || null,
          city: newArticleData.city || null,
          read_time_minutes: newArticleData.readTimeMinutes || 4,
          views_count: 1,
          saves_count: 0,
          tags: newArticleData.tags || [],
        };

        const { data, error } = await supabase.from('news').insert([dbPayload]).select().single();
        if (!error && data) {
          // If gallery images exist, save to news_images table
          if (newArticleData.images && newArticleData.images.length > 0) {
            const imgInserts = newArticleData.images.map((img, idx) => ({
              news_id: data.id,
              image_url: img.imageUrl,
              caption_en: img.captionEn || null,
              caption_hi: img.captionHi || null,
              display_order: idx,
            }));
            await supabase.from('news_images').insert(imgInserts);
          }

          // If videos exist, save to news_videos table
          if (newArticleData.videos && newArticleData.videos.length > 0) {
            const vidInserts = newArticleData.videos.map((vid, idx) => ({
              news_id: data.id,
              video_url: vid.videoUrl,
              title_en: vid.titleEn || null,
              title_hi: vid.titleHi || null,
              display_order: idx,
            }));
            await supabase.from('news_videos').insert(vidInserts);
          }

          const createdArticle = mapDbRowToArticle(data);
          localArticlesStore = [createdArticle, ...localArticlesStore];
          return createdArticle;
        } else if (error) {
          console.warn('Supabase news insert warning:', error);
        }
      } catch (err) {
        console.warn('Supabase news insert error, saving to local store', err);
      }
    }

    const created: Article = {
      ...newArticleData,
      id: `art-${Date.now()}`,
      viewsCount: 1,
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
        if (updates.titleEn !== undefined) dbUpdates.title_en = updates.titleEn;
        if (updates.titleHi !== undefined) dbUpdates.title_hi = updates.titleHi;
        if (updates.excerptEn !== undefined) dbUpdates.excerpt_en = updates.excerptEn;
        if (updates.excerptHi !== undefined) dbUpdates.excerpt_hi = updates.excerptHi;
        if (updates.contentEn !== undefined) dbUpdates.content_en = updates.contentEn;
        if (updates.contentHi !== undefined) dbUpdates.content_hi = updates.contentHi;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
        if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
        if (updates.isBreaking !== undefined) dbUpdates.is_breaking = updates.isBreaking;
        if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
        if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
        if (updates.state !== undefined) dbUpdates.state = updates.state;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { error } = await supabase.from('news').update(dbUpdates).eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase news update exception', err);
      }
    }

    localArticlesStore = localArticlesStore.map((a) => (a.id === id ? { ...a, ...updates } : a));
    return true;
  },

  // ── 8. DELETE NEWS ARTICLE (Admin) ───────────────────────────────────────
  async deleteArticle(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
          console.warn('Supabase news delete warning:', error);
        }
      } catch (err) {
        console.warn('Supabase delete exception', err);
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
        } else {
          console.warn('Storage upload error fallback:', uploadErr);
        }
      } catch (err) {
        console.warn('Upload news image exception', err);
      }
    }

    // Fallback data URL preview
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, error: null };
  },

  // ── 10. RECORD VIEW FOR ANALYTICS ────────────────────────────────────────
  // userId is passed only for display/analytics purposes; RLS prevents
  // a user from recording views under another user's ID.
  async recordView(newsId: string, userId?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('news_views').insert([
          {
            news_id: newsId,
            // Only pass user_id when the caller is authenticated; anonymous = null
            user_id: userId ?? null,
            user_agent: navigator.userAgent,
          },
        ]);
      } catch (err) {
        console.warn('Record view error', err);
      }
    }
  },
};
