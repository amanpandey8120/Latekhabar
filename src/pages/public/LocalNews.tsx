import React, { useEffect, useState } from 'react';
import type { Article, LocationData } from '../../types';
import { newsService } from '../../services/newsService';
import { LocalNewsExplorer } from '../../components/news/LocalNewsExplorer';
import { SkeletonHero } from '../../components/common/SkeletonLoader';

export const LocalNews: React.FC = () => {
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

  if (loading) return <SkeletonHero />;

  return (
    <div className="space-y-6">
      <LocalNewsExplorer locations={locations} articles={articles} />
    </div>
  );
};
