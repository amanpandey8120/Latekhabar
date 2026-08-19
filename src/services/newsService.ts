import { INITIAL_ARTICLES, INITIAL_CATEGORIES, LOCATIONS_DATA } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Article, Category, LocationData, ArticleImage, ArticleVideo } from '../types';

let localArticlesStore = [...INITIAL_ARTICLES];
let localCategoriesStore = [...INITIAL_CATEGORIES];

// Helper to convert database snake_case row to TypeScript Article interface
export const mapDbRowToArticle = (
  row: any,
  categoryMap?: Map<string, { nameEn: string; nameHi: string; slug: string }>,
  images?: ArticleImage[],
  videos?: ArticleVideo[]
): Article => {
  let categoryNameEn = row.category_name_en || row.categoryNameEn || 'General';
  let categoryNameHi = row.category_name_hi || row.categoryNameHi || 'सामान्य';

  if (categoryMap && row.category_id && categoryMap.has(row.category_id)) {
    const cat = categoryMap.get(row.category_id)!;
    categoryNameEn = cat.nameEn;
    categoryNameHi = cat.nameHi;
  }

  return {
    id: row.id,
    slug: row.slug,
    titleEn: row.title_en || row.titleEn || '',
    titleHi: row.title_hi || row.titleHi || row.title_en || row.titleEn || '',
    excerptEn: row.excerpt_en || row.excerptEn || '',
    excerptHi: row.excerpt_hi || row.excerptHi || row.excerpt_en || row.excerptEn || '',
    contentEn: row.content_en || row.contentEn || '',
    contentHi: row.content_hi || row.contentHi || row.content_en || row.contentEn || '',
    categoryId: row.category_id || row.categoryId || '',
    categoryNameEn,
    categoryNameHi,
    author: {
      name: row.author_name || row.author?.name || 'Editorial Desk',
      avatar:
        row.author_avatar ||
        row.author?.avatar ||
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      role: row.author_role || row.author?.role || 'Chief Editor',
    },
    publishedAt: row.published_at || row.publishedAt || new Date().toISOString(),
    status: row.status || 'published',
    imageUrl:
      row.image_url ||
      row.imageUrl ||
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200',
    imageCaption: row.image_caption || row.imageCaption,
    videoUrl: row.video_url || row.videoUrl,
    images: images || [],
    videos: videos || [],
    isBreaking: row.is_breaking ?? row.isBreaking ?? false,
    isTrending: row.is_trending ?? row.isTrending ?? false,
    isFeatured: row.is_featured ?? row.isFeatured ?? false,
    state: row.state,
    city: row.city,
    readTimeMinutes: row.read_time_minutes || row.readTimeMinutes || 4,
    viewsCount: row.views_count ?? row.viewsCount ?? 0,
    savesCount: row.saves_count ?? row.savesCount ?? 0,
    tags: row.tags || [],
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
        catRows?.forEach((c) => {
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
          return data.map((row) => mapDbRowToArticle(row, catMap));
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
              categoryNameEn = catData.name_en;
              categoryNameHi = catData.name_hi;
            }
          }

          // Fetch associated images from news_images table
          const { data: imageRows } = await supabase
            .from('news_images')
            .select('id, image_url, caption_en, caption_hi')
            .eq('news_id', newsRow.id)
            .order('display_order', { ascending: true });

          const articleImages: ArticleImage[] = (imageRows || []).map((img) => ({
            id: img.id,
            imageUrl: img.image_url,
            captionEn: img.caption_en || undefined,
            captionHi: img.caption_hi || undefined,
          }));

          // Fetch associated videos from news_videos table
          const { data: videoRows } = await supabase
            .from('news_videos')
            .select('id, video_url, title_en, title_hi')
            .eq('news_id', newsRow.id)
            .order('display_order', { ascending: true });

          const articleVideos: ArticleVideo[] = (videoRows || []).map((vid) => ({
            id: vid.id,
            videoUrl: vid.video_url,
            titleEn: vid.title_en || undefined,
            titleHi: vid.title_hi || undefined,
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
          return data.map((c) => ({
            id: c.id,
            slug: c.slug,
            nameEn: c.name_en,
            nameHi: c.name_hi,
            descriptionEn: c.description_en || undefined,
            descriptionHi: c.description_hi || undefined,
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
            id: data.id,
            slug: data.slug,
            nameEn: data.name_en,
            nameHi: data.name_hi,
            descriptionEn: data.description_en || undefined,
            descriptionHi: data.description_hi || undefined,
            isActive: data.is_active,
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
        const dbUpdates: any = {};
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
  async uploadNewsImage(file: File): Promise<{ url: string | null; error: any }> {
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
  async recordView(newsId: string, userId?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('news_views').insert([
          {
            news_id: newsId,
            user_id: userId || null,
            user_agent: navigator.userAgent,
          },
        ]);
      } catch (err) {
        console.warn('Record view error', err);
      }
    }
  },

  // ── 11. USER BOOKMARKS SYNCHRONIZATION ───────────────────────────────────
  async getUserBookmarks(userId: string): Promise<string[]> {
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('news_id')
          .eq('user_id', userId);

        if (!error && data) {
          return data.map((b) => b.news_id);
        }
      } catch (err) {
        console.warn('Get user bookmarks error', err);
      }
    }
    return [];
  },

  async toggleBookmark(newsId: string, userId: string, currentlySaved: boolean): Promise<boolean> {
    if (isSupabaseConfigured() && userId) {
      try {
        if (currentlySaved) {
          await supabase.from('bookmarks').delete().eq('user_id', userId).eq('news_id', newsId);
        } else {
          await supabase.from('bookmarks').insert([{ user_id: userId, news_id: newsId }]);
        }
        return true;
      } catch (err) {
        console.warn('Toggle bookmark error', err);
      }
    }
    return false;
  },
};
