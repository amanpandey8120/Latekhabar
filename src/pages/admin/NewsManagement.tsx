import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Article, Category } from '../../types';
import { newsService } from '../../services/newsService';
import { useStaffAccess } from '../../context/StaffAccessContext';
import { Search, Plus, Trash2, ExternalLink, Filter, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NewsManagement: React.FC = () => {
  const { role, userId } = useStaffAccess();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAuthorOrWriter = role === 'author' || role === 'writer';

  const loadData = useCallback(async () => {
    setLoading(true);
    const fetchParams = {
      includeDrafts: true,
      ...(isAuthorOrWriter ? { authorId: userId } : {}),
    };

    const [arts, cats] = await Promise.all([
      newsService.getArticles(fetchParams),
      newsService.getCategories(),
    ]);
    setArticles(arts);
    setCategories(cats);
    setLoading(false);
  }, [isAuthorOrWriter, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      try {
        const ok = await newsService.deleteArticle(id);
        if (ok) {
          setArticles((prev) => prev.filter((a) => a.id !== id));
          setFeedback({ type: 'success', message: `Article "${title}" deleted.` });
          setTimeout(() => setFeedback(null), 3000);
        } else {
          setFeedback({ type: 'error', message: 'Failed to delete article.' });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Failed to delete article.' });
      }
    }
  };

  const filtered = articles.filter((art) => {
    if (selectedCat !== 'all' && art.categoryId !== selectedCat && art.categoryNameEn.toLowerCase() !== selectedCat.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return art.titleEn.toLowerCase().includes(q) || art.titleHi.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline-md text-white">
            {isAuthorOrWriter ? 'My Articles' : 'News Management'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isAuthorOrWriter
              ? 'View, filter, and manage your authored stories stored in Supabase.'
              : 'View, filter, and manage all published stories stored in Supabase `news` table.'}
          </p>
        </div>

        <Link
          to="/admin/articles/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container shadow-lg transition-all"
        >
          <Plus size={16} />
          <span>Publish Article</span>
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#1c1c1c] p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search news records..."
            className="w-full border border-gray-700 bg-gray-900 rounded-lg py-2 pl-3 pr-10 text-sm text-white outline-none focus:border-primary"
          />
          <Search size={16} className="absolute right-3 top-3 text-gray-400" />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="border border-gray-700 bg-gray-900 text-white rounded-lg p-2 text-xs outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#141414] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">Thumbnail</th>
                <th className="p-4">Article Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Views</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                    Loading news from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    {isAuthorOrWriter
                      ? "You haven't authored any articles yet."
                      : 'No articles found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((art) => (
                  <tr key={art.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <img
                        src={art.imageUrl}
                        alt=""
                        className="w-12 h-10 object-cover rounded bg-gray-800"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </td>
                    <td className="p-4 font-bold text-white max-w-sm">
                      <p className="truncate">{art.titleEn}</p>
                      <p className="text-[11px] text-gray-400 font-normal truncate">{art.titleHi}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-800 rounded text-[11px] font-semibold text-gray-200">
                        {art.categoryNameEn}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-400">{art.viewsCount || 0}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {art.isBreaking && (
                          <span className="px-2 py-0.5 bg-red-950 text-red-400 rounded text-[10px] font-bold">
                            BREAKING
                          </span>
                        )}
                        {art.isTrending && (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-400 rounded text-[10px] font-bold">
                            TRENDING
                          </span>
                        )}
                        {!art.isBreaking && !art.isTrending && (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[10px] font-bold">
                            PUBLISHED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/article/${art.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-white p-1"
                          title="View Live Article"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(art.id, art.titleEn)}
                          className="text-red-400 hover:text-red-300 p-1 transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;
