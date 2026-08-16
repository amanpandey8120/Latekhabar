import { INITIAL_ARTICLES, INITIAL_CATEGORIES, LOCATIONS_DATA } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Article, Category, LocationData } from '../types';

let localArticlesStore = [...INITIAL_ARTICLES];
let localCategoriesStore = [...INITIAL_CATEGORIES];

export const newsService = {
  async getArticles(params?: {
    categorySlug?: string;
    state?: string;
    city?: string;
    searchQuery?: string;
  }): Promise<Article[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('articles').select('*');
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
          return data as Article[];
        }
      } catch (err) {
        console.warn('Supabase query error, falling back to mock service', err);
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
        const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).single();
        if (!error && data) return data as Article;
      } catch (err) {
        console.warn('Supabase article by slug error', err);
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
    return localCategoriesStore;
  },

  async getLocations(): Promise<LocationData[]> {
    return LOCATIONS_DATA;
  },

  async createArticle(newArticleData: Omit<Article, 'id' | 'viewsCount' | 'savesCount'>): Promise<Article> {
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
    localArticlesStore = localArticlesStore.filter((a) => a.id !== id);
    return true;
  },
};
