import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsService } from '../../services/newsService';
import { useAuth } from '../../context/AuthContext';
import { LOCATIONS_DATA } from '../../constants/locations';
import type { Category } from '../../types';
import { Upload, Image as ImageIcon, Video, AlertCircle, CheckCircle2, Loader2, Camera } from 'lucide-react';

export const ArticleUpload: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptHi, setExcerptHi] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [state, setState] = useState('Delhi');
  const [city, setCity] = useState('New Delhi');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCats() {
      setLoadingCats(true);
      const cats = await newsService.getCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
      setLoadingCats(false);
    }
    loadCats();
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file exceeds the 10MB maximum limit.');
      return;
    }

    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!titleEn.trim() || !contentEn.trim()) {
      setError('Please provide at least an English title and content body.');
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl.trim();

      // If an image file was selected, upload it to Supabase Storage 'news-images'
      if (imageFile) {
        setUploadingImage(true);
        const { url: uploadedUrl, error: uploadErr } = await newsService.uploadNewsImage(imageFile);
        setUploadingImage(false);

        if (uploadErr || !uploadedUrl) {
          setError('Failed to upload image. You can provide an image URL directly instead.');
          setSubmitting(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200';
      }

      const selectedCat = categories.find((c) => c.id === categoryId);

      const slug = titleEn
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const authorName = user?.fullName || 'Editorial Desk';
      const authorAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200';

      const created = await newsService.createArticle(
        {
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          titleEn: titleEn.trim(),
          titleHi: titleHi.trim() || titleEn.trim(),
          excerptEn: excerptEn.trim() || titleEn.trim(),
          excerptHi: excerptHi.trim() || titleHi.trim() || titleEn.trim(),
          contentEn: contentEn.trim(),
          contentHi: contentHi.trim() || contentEn.trim(),
          categoryId: categoryId || (selectedCat ? selectedCat.id : ''),
          categoryNameEn: selectedCat?.nameEn || 'General',
          categoryNameHi: selectedCat?.nameHi || 'सामान्य',
          author: {
            name: authorName,
            avatar: authorAvatar,
            role: user?.role === 'admin' ? 'Chief Editor' : 'Staff Journalist',
          },
          publishedAt: new Date().toISOString(),
          status: 'published',
          imageUrl: finalImageUrl,
          videoUrl: videoUrl.trim() || undefined,
          isBreaking,
          isTrending,
          isFeatured,
          state,
          city,
          readTimeMinutes: Math.max(1, Math.ceil(contentEn.trim().split(/\s+/).length / 180)),
          tags: ['LateKhabar', selectedCat?.nameEn || 'News'],
        },
        user?.id
      );

      if (created) {
        setSuccess('Article published successfully! Redirecting to news management...');
        setTimeout(() => {
          navigate('/admin/articles');
        }, 1500);
      } else {
        setError('Failed to publish article. Please verify your connection and permissions.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during publishing.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const currentLocation = LOCATIONS_DATA.find((l) => l.state === state);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold font-headline-md text-white">Publish New Article</h1>
        <p className="text-xs text-gray-400 mt-1">
          Create and publish editorial news in English and Hindi directly into Supabase database.
        </p>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Story Headlines */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">1. Story Headlines</h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Title (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Major Renewable Energy Accord Signed in Geneva"
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary transition-colors disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Title (Hindi)</label>
            <input
              type="text"
              value={titleHi}
              onChange={(e) => setTitleHi(e.target.value)}
              placeholder="उदा. जेनेवा में ऐतिहासिक नवीकरणीय ऊर्जा समझौते पर हस्ताक्षर"
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary transition-colors disabled:opacity-60"
            />
          </div>
        </div>

        {/* 2. Excerpt & Body Content */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">2. Story Body & Excerpt</h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Excerpt (English Summary)</label>
            <textarea
              rows={2}
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              placeholder="Brief 1-2 sentence lead paragraph..."
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary font-article-body disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Excerpt (Hindi Summary)</label>
            <textarea
              rows={2}
              value={excerptHi}
              onChange={(e) => setExcerptHi(e.target.value)}
              placeholder="संक्षिप्त विवरण हिन्दी में..."
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary font-article-body disabled:opacity-60"
            />
          </div>


          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Content Body (English) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder="Full article text in English..."
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary font-article-body disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Content Body (Hindi)</label>
            <textarea
              rows={6}
              value={contentHi}
              onChange={(e) => setContentHi(e.target.value)}
              placeholder="लेख का मुख्य भाग हिन्दी में..."
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-3 text-sm text-white outline-none focus:border-primary font-article-body disabled:opacity-60"
            />
          </div>
        </div>

        {/* 3. Category & Region */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">3. Category & Region</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting || loadingCats}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary"
              >
                {loadingCats ? (
                  <option>Loading categories...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameEn} ({cat.nameHi})
                    </option>
                  ))
                )}
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
                disabled={submitting}
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
                disabled={submitting}
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

        {/* 4. Media Attachments */}
        <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">4. Media Attachments</h3>

          {/* Hero Image File Upload or URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <ImageIcon size={14} /> Hero Image (Upload File to Supabase Storage or Paste Web URL)
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg border border-gray-700 transition-colors cursor-pointer"
              >
                <Camera size={14} />
                <span>Choose Image File</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageFileChange}
              />

              <span className="text-xs text-gray-500">or</span>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value) {
                    setImagePreview(e.target.value);
                    setImageFile(null);
                  }
                }}
                placeholder="Paste Image URL (https://images.unsplash.com/...)"
                disabled={submitting}
                className="flex-grow border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary transition-colors disabled:opacity-60"
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3 relative w-48 h-32 rounded-lg overflow-hidden border border-gray-700 bg-black">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                    setImageUrl('');
                  }}
                  className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[10px] rounded hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1.5">
              <Video size={14} /> YouTube Video Embed URL (Optional)
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              disabled={submitting}
              className="w-full border border-gray-700 bg-gray-900 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary transition-colors disabled:opacity-60"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span>Set as Breaking News Alert</span>
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

            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span>Set as Homepage Featured Hero</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            disabled={submitting}
            className="px-6 py-3 border border-gray-700 text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container shadow-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{uploadingImage ? 'Uploading Image...' : 'Publishing Article...'}</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Publish Article</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
