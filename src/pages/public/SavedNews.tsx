import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { ArticleCard } from '../../components/news/ArticleCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { Bookmark } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const SavedNews: React.FC = () => {
  const { savedArticleIds } = useAuth();
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      setLoading(true);
      const allArts = await newsService.getArticles();
      const bookmarked = allArts.filter((a) => savedArticleIds.includes(a.id));
      setArticles(bookmarked);
      setLoading(false);
    }
    loadSaved();
  }, [savedArticleIds]);

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
          <p className="text-xs text-gray-500">{articles.length} bookmarked articles in your collection</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
