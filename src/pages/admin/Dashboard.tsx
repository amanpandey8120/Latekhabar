import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { FileText, Eye, Video, Zap, Plus, Trash2, ExternalLink } from 'lucide-react';

export const Dashboard: React.FC = () => {
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

  return (
    <div className="space-y-8">
      {/* Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline-md text-white">Editorial Control Room</h1>
          <p className="text-xs text-gray-400">Overview of published news content, reader analytics, and breaking alerts.</p>
        </div>
        <Link
          to="/admin/articles/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container shadow-lg transition-all"
        >
          <Plus size={16} />
          <span>Publish New Article</span>
        </Link>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Articles</span>
            <FileText size={20} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-white font-headline-md">{articles.length}</p>
          <p className="text-[11px] text-green-400">Live across all categories</p>
        </div>

        <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reader Views</span>
            <Eye size={20} className="text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-white font-headline-md">{totalViews.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">Audience engagement</p>
        </div>

        <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Video Reports</span>
            <Video size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white font-headline-md">{totalVideos}</p>
          <p className="text-[11px] text-gray-400">YouTube embedded feeds</p>
        </div>

        <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Breaking Alerts</span>
            <Zap size={20} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white font-headline-md">{totalBreaking}</p>
          <p className="text-[11px] text-red-400 font-bold">Active ticker alerts</p>
        </div>
      </div>

      {/* Recent Articles Table */}
      <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-headline-md">Recent Published News</h3>
          <Link to="/admin/articles" className="text-xs text-primary font-bold hover:underline">
            View All Articles ({articles.length})
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading content list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#141414] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Article Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Published Date</th>
                  <th className="p-4 text-center">Breaking</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {articles.slice(0, 5).map((art) => (
                  <tr key={art.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 font-bold text-white max-w-xs truncate">{art.titleEn}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-gray-800 rounded text-[11px] font-semibold text-gray-200">
                        {art.categoryNameEn}
                      </span>
                    </td>
                    <td className="p-4">{art.author.name}</td>
                    <td className="p-4">{new Date(art.publishedAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      {art.isBreaking ? (
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 rounded text-[10px] font-bold">
                          YES
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/article/${art.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-white"
                          title="View Live"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete Article"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
