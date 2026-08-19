import React, { useEffect, useState } from 'react';
import { newsService } from '../../services/newsService';
import type { Category } from '../../types';
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2, FolderTree } from 'lucide-react';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEn, setNewEn] = useState('');
  const [newHi, setNewHi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    const data = await newsService.getCategories(true);
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn.trim()) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    const slug = newEn
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const created = await newsService.createCategory({
      slug,
      nameEn: newEn.trim(),
      nameHi: newHi.trim() || newEn.trim(),
      descriptionEn: `${newEn.trim()} news coverage and analysis`,
      descriptionHi: `${newHi.trim() || newEn.trim()} समाचार एवं विश्लेषण`,
      isActive: true,
    });

    if (created) {
      setSuccess(`Category "${created.nameEn}" created successfully!`);
      setNewEn('');
      setNewHi('');
      await loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to create category. Please check your admin privileges.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      const ok = await newsService.deleteCategory(id);
      if (ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setSuccess(`Category "${name}" deleted.`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete category.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold font-headline-md text-white flex items-center gap-2.5">
          <FolderTree className="text-primary" />
          Category Management
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Add or manage news categories in English and Hindi (stored in Supabase `categories` table).
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Category Form */}
      <form
        onSubmit={handleAdd}
        className="bg-[#1c1c1c] p-5 rounded-xl border border-gray-800 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={newEn}
          onChange={(e) => setNewEn(e.target.value)}
          placeholder="Category Name in English (e.g. Science)"
          disabled={submitting}
          className="border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary flex-grow transition-colors disabled:opacity-60"
          required
        />
        <input
          type="text"
          value={newHi}
          onChange={(e) => setNewHi(e.target.value)}
          placeholder="श्रेणी नाम हिन्दी में (उदा. विज्ञान)"
          disabled={submitting}
          className="border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary flex-grow transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container shadow transition-all disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Add Category</span>
            </>
          )}
        </button>
      </form>

      {/* Categories Table */}
      <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#141414] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">Slug</th>
                <th className="p-4">English Name</th>
                <th className="p-4">Hindi Name</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                    Loading categories from database...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No categories found. Create the first category above.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 font-mono text-primary font-bold">{cat.slug}</td>
                    <td className="p-4 font-bold text-white">{cat.nameEn}</td>
                    <td className="p-4">{cat.nameHi}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(cat.id, cat.nameEn)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
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
