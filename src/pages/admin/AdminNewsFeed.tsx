import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { ExternalLink, Zap, TrendingUp } from 'lucide-react';

/**
 * AdminNewsFeed — accessible at /admin/news
 * Lists all published articles with quick filters for Breaking / Trending.
 */
export const AdminNewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'breaking' | 'trending'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setArticles(await newsService.getArticles());
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    filter === 'breaking'
      ? articles.filter((a) => a.isBreaking)
      : filter === 'trending'
      ? articles.filter((a) => a.isTrending)
      : articles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">News Feed</h1>
          <p className="text-sm text-gray-400 mt-0.5">All published articles overview</p>
        </div>
        <Link
          to="/admin/articles/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow"
        >
          + Publish Article
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'breaking', 'trending'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {f === 'breaking' && <Zap size={11} className="inline mr-1" />}
            {f === 'trending' && <TrendingUp size={11} className="inline mr-1" />}
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{filtered.length} articles</span>
      </div>

      {/* Articles list */}
      <div className="bg-[#1c1c1c] rounded-xl border border-gray-800 divide-y divide-gray-800">
        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm">Loading articles...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No articles match this filter.</div>
        ) : (
          filtered.map((article) => (
            <div
              key={article.id}
              className="px-6 py-4 flex items-start gap-4 hover:bg-gray-900/40 transition-colors"
            >
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.titleEn}
                  className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  {article.isBreaking && (
                    <span className="px-1.5 py-0.5 bg-red-950 text-red-400 rounded text-[10px] uppercase font-bold">
                      Breaking
                    </span>
                  )}
                  {article.isTrending && (
                    <span className="px-1.5 py-0.5 bg-orange-950 text-orange-400 rounded text-[10px] uppercase font-bold">
                      Trending
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">{article.categoryNameEn}</span>
                </div>
                <p className="text-xs font-semibold text-gray-200 truncate">{article.titleEn}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {article.viewsCount?.toLocaleString()} views · {article.readTimeMinutes} min read
                </p>
              </div>
              <Link
                to={`/article/${article.slug}`}
                target="_blank"
                className="flex-shrink-0 p-2 text-gray-500 hover:text-white transition-colors"
                title="View article"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
