import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Article } from '../../types';
import { loadBookmarkedArticles } from '../../services/bookmarkService';
import { ArticleCard } from '../../components/news/ArticleCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { Bookmark, LogIn } from 'lucide-react';

export const SavedNews: React.FC = () => {
  const { user, savedArticleIds } = useAuth();
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Saved Articles | Late Khabar";
    let cancelled = false;

    async function loadSaved() {
      if (!user) {
        setArticles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const saved = await loadBookmarkedArticles();
      if (!cancelled) {
        setArticles(saved);
        setLoading(false);
      }
    }

    loadSaved();
    return () => { cancelled = true; };
  }, [user, savedArticleIds]);

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="p-2.5 bg-red-100 dark:bg-red-950 text-primary rounded-lg">
            <Bookmark size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface dark:text-white">
              {t('savedNews')}
            </h1>
          </div>
        </div>
        <EmptyState
          title="Sign in to view your saved stories"
          message="Create an account or sign in to bookmark articles and read them later."
          action={
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <LogIn size={16} />
              Sign In
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="p-2.5 bg-red-100 dark:bg-red-950 text-primary rounded-lg">
          <Bookmark size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline-md text-on-surface dark:text-white">
            {t('savedNews')}
          </h1>
          <p className="text-xs text-gray-500">
            {loading
              ? 'Loading…'
              : `${articles.length} bookmarked ${articles.length === 1 ? 'article' : 'articles'} in your collection`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="grid" />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved stories yet"
          message="Click the bookmark icon on any story to save it for reading later."
        />
      )}
    </div>
  );
};
