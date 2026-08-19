import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { FileText, Eye, Video, Zap, Plus, Trash2, ExternalLink } from 'lucide-react';

/**
 * AdminDashboard — accessible at /admin/dashboard
 * Mirrors the existing Dashboard component (previously at /admin) so the
 * /admin redirect still works while the sidebar correctly points to /admin/dashboard.
 */
export const AdminDashboard: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const arts = await newsService.getArticles();
      setArticles(arts);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalViews = articles.reduce((sum, a) => sum + (a.viewsCount || 0), 0);
  const totalVideos = articles.filter((a) => a.videoUrl).length;
  const totalBreaking = articles.filter((a) => a.isBreaking).length;

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await newsService.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const stats = [
    { label: 'Published Articles', value: articles.length, icon: FileText, color: 'text-blue-400' },
    { label: 'Total Readers', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-400' },
    { label: 'Video Reports', value: totalVideos, icon: Video, color: 'text-purple-400' },
    { label: 'Breaking News', value: totalBreaking, icon: Zap, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Overview of your editorial platform</p>
        </div>
        <Link
          to="/admin/articles/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow"
        >
          <Plus size={16} />
          Publish New Article
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#1c1c1c] rounded-xl p-5 border border-gray-800 flex flex-col gap-3"
            >
              <div className={`${stat.color} flex items-center gap-2`}>
                <Icon size={20} />
                <span className="text-xs font-semibold text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{loading ? '—' : stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent articles table */}
      <div className="bg-[#1c1c1c] rounded-xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent Articles</h2>
          <Link
            to="/admin/articles"
            className="text-xs text-primary hover:underline font-semibold"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No articles published yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {articles.slice(0, 8).map((article) => (
              <div
                key={article.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-semibold text-gray-200 truncate">{article.titleEn}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {article.categoryNameEn} · {article.viewsCount?.toLocaleString()} views
                    {article.isBreaking && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-950 text-red-400 rounded text-[10px] uppercase font-bold">
                        Breaking
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/article/${article.slug}`}
                    target="_blank"
                    className="p-1.5 text-gray-500 hover:text-white transition-colors"
                    title="View article"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete article"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
