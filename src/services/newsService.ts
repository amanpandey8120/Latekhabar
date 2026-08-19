import { INITIAL_ARTICLES, INITIAL_CATEGORIES, LOCATIONS_DATA } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Article, Category, LocationData } from '../types';

let localArticlesStore = [...INITIAL_ARTICLES];
let localCategoriesStore = [...INITIAL_CATEGORIES];

// Helper to convert database snake_case row to TypeScript Article interface
const mapDbRowToArticle = (row: any): Article => {
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
    categoryNameEn: row.category_name_en || row.categoryNameEn || 'General',
    categoryNameHi: row.category_name_hi || row.categoryNameHi || 'सामान्य',
    author: {
      name: row.author_name || row.author?.name || 'Editorial Desk',
      avatar: row.author_avatar || row.author?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      role: row.author_role || row.author?.role || 'Chief Editor',
    },
    publishedAt: row.published_at || row.publishedAt || new Date().toISOString(),
    imageUrl: row.image_url || row.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200',
    imageCaption: row.image_caption || row.imageCaption,
    videoUrl: row.video_url || row.videoUrl,
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
  async getArticles(params?: {
    categorySlug?: string;
    state?: string;
    city?: string;
    searchQuery?: string;
  }): Promise<Article[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('news').select('*');
        if (params?.categorySlug) {
          query = query.eq('category_slug', params.categorySlug);
        }
        if (params?.state) {
          query = query.eq('state', params.state);
        }
        if (params?.city) {
          query = query.eq('city', params.city);
        }
        if (params?.searchQuery) {
          query = query.or(`title_en.ilike.%${params.searchQuery}%,title_hi.ilike.%${params.searchQuery}%`);
        }
        const { data, error } = await query.order('published_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(mapDbRowToArticle);
        }
      } catch (err) {
        console.warn('Supabase news query error, falling back to mock service', err);
      }
    }

    // Fallback mock filtering
    let results = [...localArticlesStore];
    if (params?.categorySlug) {
      const cat = localCategoriesStore.find((c) => c.slug === params.categorySlug);
      if (cat) {
        results = results.filter((a) => a.categoryId === cat.id);
      }
    }
    if (params?.state) {
      results = results.filter((a) => a.state?.toLowerCase() === params.state?.toLowerCase());
    }
    if (params?.city) {
      results = results.filter((a) => a.city?.toLowerCase() === params.city?.toLowerCase());
    }
    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.titleEn.toLowerCase().includes(q) ||
          a.titleHi.toLowerCase().includes(q) ||
          a.excerptEn.toLowerCase().includes(q) ||
          a.excerptHi.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return results;
  },

  async getArticleBySlug(slug: string): Promise<Article | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('news').select('*').eq('slug', slug).single();
        if (!error && data) return mapDbRowToArticle(data);
      } catch (err) {
        console.warn('Supabase news by slug error', err);
      }
    }
    const found = localArticlesStore.find((a) => a.slug === slug || a.id === slug);
    return found || null;
  },

  async getBreakingArticles(): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles.filter((a) => a.isBreaking);
  },

  async getTrendingArticles(): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles.filter((a) => a.isTrending);
  },

  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            slug: c.slug,
            nameEn: c.name_en,
            nameHi: c.name_hi,
            descriptionEn: c.description_en,
            descriptionHi: c.description_hi,
          }));
        }
      } catch (err) {
        console.warn('Supabase categories fetch error', err);
      }
    }
    return localCategoriesStore;
  },

  async getLocations(): Promise<LocationData[]> {
    return LOCATIONS_DATA;
  },

  async createArticle(newArticleData: Omit<Article, 'id' | 'viewsCount' | 'savesCount'>): Promise<Article> {
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
          category_id: newArticleData.categoryId || null,
          category_slug: newArticleData.categoryNameEn?.toLowerCase() || 'general',
          author_name: newArticleData.author.name,
          author_avatar: newArticleData.author.avatar,
          author_role: newArticleData.author.role,
          published_at: newArticleData.publishedAt || new Date().toISOString(),
          status: 'published',
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
          const createdArticle = mapDbRowToArticle(data);
          localArticlesStore = [createdArticle, ...localArticlesStore];
          return createdArticle;
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

  async deleteArticle(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
          console.warn('Supabase news delete error', error);
        }
      } catch (err) {
        console.warn('Supabase delete exception', err);
      }
    }
    localArticlesStore = localArticlesStore.filter((a) => a.id !== id);
    return true;
  },

  // Record a news view for analytics
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
};
