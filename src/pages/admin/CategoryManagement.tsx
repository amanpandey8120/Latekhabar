import React, { useState } from 'react';
import { INITIAL_CATEGORIES } from '../../lib/mockData';
import { Plus, Trash2 } from 'lucide-react';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newEn, setNewEn] = useState('');
  const [newHi, setNewHi] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn) return;
    const created = {
      id: `cat-${Date.now()}`,
      slug: newEn.toLowerCase().replace(/\s+/g, '-'),
      nameEn: newEn,
      nameHi: newHi || newEn,
      descriptionEn: `${newEn} news coverage`,
      descriptionHi: `${newHi || newEn} समाचार`,
    };
    setCategories([...categories, created]);
    setNewEn('');
    setNewHi('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold font-headline-md text-white">Category Management</h1>
        <p className="text-xs text-gray-400">Add or manage news section categories and Hindi titles.</p>
      </div>

      <form onSubmit={handleAdd} className="bg-[#1c1c1c] p-5 rounded-xl border border-gray-800 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newEn}
          onChange={(e) => setNewEn(e.target.value)}
          placeholder="New Category Name (EN)"
          className="border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary flex-grow"
          required
        />
        <input
          type="text"
          value={newHi}
          onChange={(e) => setNewHi(e.target.value)}
          placeholder="नवीन श्रेणी नाम (HI)"
          className="border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary flex-grow"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container shadow"
        >
          <Plus size={16} /> Add Category
        </button>
      </form>

      <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#141414] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
            <tr>
              <th className="p-4">Slug</th>
              <th className="p-4">English Name</th>
              <th className="p-4">Hindi Name</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-800/40">
                <td className="p-4 font-mono text-primary">{cat.slug}</td>
                <td className="p-4 font-bold text-white">{cat.nameEn}</td>
                <td className="p-4">{cat.nameHi}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
