import React, { useEffect, useState } from 'react';
import type { Article, LocationData } from '../../types';
import { newsService } from '../../services/newsService';
import { HeroCard } from '../../components/news/HeroCard';
import { ArticleCard } from '../../components/news/ArticleCard';
import { VideoCard } from '../../components/news/VideoCard';
import { LocalNewsExplorer } from '../../components/news/LocalNewsExplorer';
import { SkeletonHero, SkeletonCard } from '../../components/common/SkeletonLoader';
import { useLanguage } from '../../context/LanguageContext';
import { Flame, Video, Newspaper } from 'lucide-react';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [arts, locs] = await Promise.all([
        newsService.getArticles(),
        newsService.getLocations(),
      ]);
      setArticles(arts);
      setLocations(locs);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonHero />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const heroArticle = articles.find((a) => a.isFeatured) || articles[0];
  const trendingArticles = articles.filter((a) => a.isTrending && a.id !== heroArticle?.id).slice(0, 4);
  const videoArticles = articles.filter((a) => a.videoUrl);
  const remainingArticles = articles.filter((a) => a.id !== heroArticle?.id);

  return (
    <div className="space-y-12">
      {/* 12-Column Grid Layout matching Stitch Homepage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Main Feed (Cols 1-8) */}
        <div className="lg:col-span-8 space-y-8">
          {heroArticle && <HeroCard article={heroArticle} />}

          {/* Secondary Feed Grid */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Newspaper size={20} className="text-primary" />
              <h2 className="text-xl font-bold font-headline-md text-on-surface dark:text-white">
                {t('topStories')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {remainingArticles.slice(0, 4).map((art) => (
                <ArticleCard key={art.id} article={art} variant="grid" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Cols 9-12) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Trending News Widget */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Flame size={20} className="text-amber-500 fill-amber-500" />
              <h3 className="text-base font-bold font-headline-md text-on-surface dark:text-white uppercase tracking-wider">
                {t('trending')}
              </h3>
            </div>

            <div className="space-y-3">
              {trendingArticles.map((art) => (
                <ArticleCard key={art.id} article={art} variant="horizontal" />
              ))}
            </div>
          </div>

          {/* Video Reports Widget */}
          {videoArticles.length > 0 && (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Video size={20} className="text-red-600" />
                <h3 className="text-base font-bold font-headline-md text-on-surface dark:text-white uppercase tracking-wider">
                  {t('multimedia')}
                </h3>
              </div>

              <div className="space-y-4">
                {videoArticles.slice(0, 2).map((art) => (
                  <VideoCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regional & City Local Explorer */}
      <LocalNewsExplorer locations={locations} articles={articles} />
    </div>
  );
};
