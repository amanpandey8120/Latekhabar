import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsService } from '../../services/newsService';
import { INITIAL_CATEGORIES, LOCATIONS_DATA } from '../../lib/mockData';
import { Upload, Image as ImageIcon, Video } from 'lucide-react';

export const ArticleUpload: React.FC = () => {
  const navigate = useNavigate();

  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptHi] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [categoryId, setCategoryId] = useState(INITIAL_CATEGORIES[0].id);
  const [state, setState] = useState('Delhi');
  const [city, setCity] = useState('New Delhi');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !contentEn) return;

    setSubmitting(true);
    const cat = INITIAL_CATEGORIES.find((c) => c.id === categoryId) || INITIAL_CATEGORIES[0];

    const slug = titleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    await newsService.createArticle({
      slug,
      titleEn,
      titleHi: titleHi || titleEn,
      excerptEn: excerptEn || titleEn,
      excerptHi: excerptHi || titleHi || titleEn,
      contentEn,
      contentHi: contentHi || contentEn,
      categoryId: cat.id,
      categoryNameEn: cat.nameEn,
      categoryNameHi: cat.nameHi,
      author: {
        name: 'Editorial Desk',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        role: 'Chief Editor',
      },
      publishedAt: new Date().toISOString(),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200',
      videoUrl: videoUrl || undefined,
      isBreaking,
      isTrending,
      state,
      city,
      readTimeMinutes: 4,
      tags: ['LateKhabar', cat.nameEn],
    });

    setSubmitting(false);
    navigate('/admin/articles');
  };

  const currentLocation = LOCATIONS_DATA.find((l) => l.state === state);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold font-headline-md text-white">Publish New Article</h1>
        <p className="text-xs text-gray-400">Create and upload editorial news content in English and Hindi.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bilingual Headlines */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">1. Story Headlines</h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Title (English) *</label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Major Renewable Energy Summit Concludes in Geneva"
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Title (Hindi)</label>
            <input
              type="text"
              value={titleHi}
              onChange={(e) => setTitleHi(e.target.value)}
              placeholder="e.g. जेनेवा में संपन्न हुआ प्रमुख नवीकरणीय ऊर्जा शिखर सम्मेलन"
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Excerpt & Body Content */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">2. Story Body & Excerpt</h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Excerpt (English Summary)</label>
            <textarea
              rows={2}
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Content Body (English) *</label>
            <textarea
              rows={6}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary font-article-body"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Content Body (Hindi)</label>
            <textarea
              rows={6}
              value={contentHi}
              onChange={(e) => setContentHi(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary font-article-body"
            />
          </div>
        </div>

        {/* Category & Location */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">3. Category & Region</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary"
              >
                {INITIAL_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">State</label>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  const firstCity = LOCATIONS_DATA.find((l) => l.state === e.target.value)?.cities[0]?.nameEn || '';
                  setCity(firstCity);
                }}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary"
              >
                {LOCATIONS_DATA.map((loc) => (
                  <option key={loc.state} value={loc.state}>
                    {loc.state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary"
              >
                {currentLocation?.cities.map((c) => (
                  <option key={c.nameEn} value={c.nameEn}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Media Attachments */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">4. Media Attachments</h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1.5">
              <ImageIcon size={14} /> Hero Image URL (Supabase Storage / Web URL)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1.5">
              <Video size={14} /> YouTube Video Embed URL (Optional)
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/5qap5aO4i9A"
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span>Set as Breaking News Ticker Alert</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span>Set as Trending Story</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="px-6 py-3 border border-gray-700 text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container shadow-lg transition-all"
          >
            <Upload size={16} />
            <span>{submitting ? 'Publishing...' : 'Publish Article'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
