import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { Search, Plus, Trash2, ExternalLink, Filter } from 'lucide-react';

export const NewsManagement: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  useEffect(() => {
    async function loadData() {
      const arts = await newsService.getArticles();
      setArticles(arts);
    }
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this news story?')) {
      await newsService.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const filtered = articles.filter((art) => {
    if (selectedCat !== 'all' && art.categoryNameEn.toLowerCase() !== selectedCat.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return art.titleEn.toLowerCase().includes(q) || art.titleHi.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline-md text-white">News Management</h1>
          <p className="text-xs text-gray-400">View, edit, or delete published stories in Late Khabar.</p>
        </div>

        <Link
          to="/admin/articles/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container shadow-lg transition-all"
        >
          <Plus size={16} />
          <span>Publish Article</span>
        </Link>
      </div>

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
            className="border border-gray-700 bg-gray-900 text-white rounded-lg p-2 text-xs outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="national">National</option>
            <option value="international">International</option>
            <option value="business">Business</option>
            <option value="sports">Sports</option>
            <option value="technology">Technology</option>
            <option value="environment">Environment</option>
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
                <th className="p-4 text-center">Breaking</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((art) => (
                <tr key={art.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4">
                    <img src={art.imageUrl} alt="" className="w-12 h-10 object-cover rounded" />
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
                    {art.isBreaking ? (
                      <span className="px-2 py-0.5 bg-red-950 text-red-400 rounded text-[10px] font-bold">
                        BREAKING
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
      </div>
    </div>
  );
};
