export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          language: 'en' | 'hi' | null
          state: string | null
          city: string | null
          preferred_categories: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          language?: 'en' | 'hi' | null
          state?: string | null
          city?: string | null
          preferred_categories?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          language?: 'en' | 'hi' | null
          state?: string | null
          city?: string | null
          preferred_categories?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          slug: string
          name_en: string
          name_hi: string
          description_en: string | null
          description_hi: string | null
          is_active: boolean
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name_en: string
          name_hi: string
          description_en?: string | null
          description_hi?: string | null
          is_active?: boolean
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name_en?: string
          name_hi?: string
          description_en?: string | null
          description_hi?: string | null
          is_active?: boolean
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          id: string
          slug: string
          title_en: string
          title_hi: string
          excerpt_en: string | null
          excerpt_hi: string | null
          content_en: string
          content_hi: string
          category_id: string | null
          category_slug: string | null
          author_id: string | null
          author_name: string | null
          author_avatar: string | null
          author_role: string | null
          published_at: string | null
          status: 'draft' | 'published' | 'archived'
          is_published: boolean
          is_breaking: boolean
          is_trending: boolean
          is_featured: boolean
          image_url: string | null
          image_caption: string | null
          video_url: string | null
          state: string | null
          city: string | null
          read_time_minutes: number | null
          views_count: number | null
          saves_count: number | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title_en: string
          title_hi: string
          excerpt_en?: string | null
          excerpt_hi?: string | null
          content_en: string
          content_hi: string
          category_id?: string | null
          category_slug?: string | null
          author_id?: string | null
          author_name?: string | null
          author_avatar?: string | null
          author_role?: string | null
          published_at?: string | null
          status?: 'draft' | 'published' | 'archived'
          is_published?: boolean
          is_breaking?: boolean
          is_trending?: boolean
          is_featured?: boolean
          image_url?: string | null
          image_caption?: string | null
          video_url?: string | null
          state?: string | null
          city?: string | null
          read_time_minutes?: number | null
          views_count?: number | null
          saves_count?: number | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title_en?: string
          title_hi?: string
          excerpt_en?: string | null
          excerpt_hi?: string | null
          content_en?: string
          content_hi?: string
          category_id?: string | null
          category_slug?: string | null
          author_id?: string | null
          author_name?: string | null
          author_avatar?: string | null
          author_role?: string | null
          published_at?: string | null
          status?: 'draft' | 'published' | 'archived'
          is_published?: boolean
          is_breaking?: boolean
          is_trending?: boolean
          is_featured?: boolean
          image_url?: string | null
          image_caption?: string | null
          video_url?: string | null
          state?: string | null
          city?: string | null
          read_time_minutes?: number | null
          views_count?: number | null
          saves_count?: number | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      news_images: {
        Row: {
          id: string
          news_id: string
          image_url: string
          caption_en: string | null
          caption_hi: string | null
          display_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          news_id: string
          image_url: string
          caption_en?: string | null
          caption_hi?: string | null
          display_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          news_id?: string
          image_url?: string
          caption_en?: string | null
          caption_hi?: string | null
          display_order?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_images_news_id_fkey"
            columns: ["news_id"]
            referencedRelation: "news"
            referencedColumns: ["id"]
          }
        ]
      }
      news_videos: {
        Row: {
          id: string
          news_id: string
          video_url: string
          title_en: string | null
          title_hi: string | null
          display_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          news_id: string
          video_url: string
          title_en?: string | null
          title_hi?: string | null
          display_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          news_id?: string
          video_url?: string
          title_en?: string | null
          title_hi?: string | null
          display_order?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_videos_news_id_fkey"
            columns: ["news_id"]
            referencedRelation: "news"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          news_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          news_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          news_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_news_id_fkey"
            columns: ["news_id"]
            referencedRelation: "news"
            referencedColumns: ["id"]
          }
        ]
      }
      news_views: {
        Row: {
          id: string
          news_id: string
          user_id: string | null
          ip_hash: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          news_id: string
          user_id?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          news_id?: string
          user_id?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_views_news_id_fkey"
            columns: ["news_id"]
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_views_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      articles: {
        Row: {
          id: string
          slug: string
          title_en: string
          title_hi: string
          excerpt_en: string | null
          excerpt_hi: string | null
          content_en: string
          content_hi: string
          category_id: string | null
          category_slug: string | null
          author_id: string | null
          author_name: string | null
          author_avatar: string | null
          author_role: string | null
          published_at: string | null
          status: 'draft' | 'published' | 'archived'
          is_published: boolean
          is_breaking: boolean
          is_trending: boolean
          is_featured: boolean
          image_url: string | null
          image_caption: string | null
          video_url: string | null
          state: string | null
          city: string | null
          read_time_minutes: number | null
          views_count: number | null
          saves_count: number | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
