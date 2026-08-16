export type Language = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark';
export type UserRole = 'user' | 'admin';

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
}

export interface Article {
  id: string;
  slug: string;
  titleEn: string;
  titleHi: string;
  excerptEn: string;
  excerptHi: string;
  contentEn: string;
  contentHi: string;
  categoryId: string;
  categoryNameEn: string;
  categoryNameHi: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  imageUrl: string;
  imageCaption?: string;
  videoUrl?: string; // YouTube embed URL or ID
  isBreaking?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  state?: string;
  city?: string;
  readTimeMinutes: number;
  viewsCount: number;
  savesCount: number;
  tags: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  language: Language;
  preferredCategories: string[];
  state?: string;
  city?: string;
  createdAt: string;
}

export interface LocationData {
  state: string;
  stateHi: string;
  cities: { nameEn: string; nameHi: string }[];
}

export interface AnalyticsSummary {
  totalArticles: number;
  totalViews: number;
  totalUsers: number;
  totalVideos: number;
  trendingArticlesCount: number;
}
