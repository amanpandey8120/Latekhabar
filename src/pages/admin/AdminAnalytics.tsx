import React, { useEffect, useState } from 'react';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { BarChart3, TrendingUp, Eye, Bookmark, Zap } from 'lucide-react';

/**
 * AdminAnalytics — accessible at /admin/analytics
 * Shows aggregate analytics computed from article data.
 */
export const AdminAnalytics: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setArticles(await newsService.getArticles());
      setLoading(false);
    }
    load();
  }, []);

  const totalViews = articles.reduce((s, a) => s + (a.viewsCount || 0), 0);
  const totalSaves = articles.reduce((s, a) => s + (a.savesCount || 0), 0);
  const totalBreaking = articles.filter((a) => a.isBreaking).length;
  const totalTrending = articles.filter((a) => a.isTrending).length;

  // Top 5 articles by views
  const topByViews = [...articles].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 5);

  // Category distribution
  const catMap: Record<string, number> = {};
  articles.forEach((a) => {
    catMap[a.categoryNameEn] = (catMap[a.categoryNameEn] || 0) + 1;
  });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform performance and content insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-400' },
          { label: 'Total Saves', value: totalSaves.toLocaleString(), icon: Bookmark, color: 'text-emerald-400' },
          { label: 'Breaking Articles', value: totalBreaking, icon: Zap, color: 'text-amber-400' },
          { label: 'Trending Articles', value: totalTrending, icon: TrendingUp, color: 'text-purple-400' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-[#1c1c1c] rounded-xl p-5 border border-gray-800">
              <div className={`${kpi.color} flex items-center gap-2 mb-3`}>
                <Icon size={18} />
                <span className="text-xs text-gray-400 font-semibold">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{loading ? '—' : kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top articles by views */}
        <div className="bg-[#1c1c1c] rounded-xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-white">Top Articles by Views</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {topByViews.map((article, idx) => (
                <div key={article.id} className="px-6 py-3 flex items-center gap-4">
                  <span className="text-gray-600 text-xs font-bold w-5 flex-shrink-0">{idx + 1}</span>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{article.titleEn}</p>
                    <p className="text-[11px] text-gray-500">{article.categoryNameEn}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-300 flex-shrink-0">
                    {(article.viewsCount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category distribution */}
        <div className="bg-[#1c1c1c] rounded-xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-white">Articles by Category</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
          ) : (
            <div className="px-6 py-4 space-y-3">
              {catEntries.map(([cat, count]) => {
                const pct = articles.length > 0 ? Math.round((count / articles.length) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-semibold">{cat}</span>
                      <span className="text-gray-500">{count} articles ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        * Analytics are computed from published article data. Real-time tracking integration coming soon.
      </p>
    </div>
  );
};
