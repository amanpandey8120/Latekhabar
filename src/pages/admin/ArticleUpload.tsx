import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsService, getArticleAuthors } from '../../services/newsService';
import type { AuthorProfile } from '../../services/newsService';
import { useAuth } from '../../context/AuthContext';
import { useStaffAccess } from '../../context/StaffAccessContext';
import { LOCATIONS_DATA } from '../../constants/locations';
import type { Category, Article } from '../../types';
import { Upload, Image as ImageIcon, Video, AlertCircle, CheckCircle2, Loader2, Camera, UserCircle, Edit3, ShieldAlert } from 'lucide-react';

export const ArticleUpload: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { role: staffRole, userId: staffUserId } = useStaffAccess();
  const currentRole = (staffRole || user?.role || 'user').toLowerCase().trim();
  const isAuthorOrWriter = currentRole === 'author' || currentRole === 'writer';
  const effectiveUserId = staffUserId || user?.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catError, setCatError] = useState('');

  // Loading state for edit mode
  const [loadingArticle, setLoadingArticle] = useState(isEditMode);
  const [originalArticle, setOriginalArticle] = useState<Article | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [existingStatus, setExistingStatus] = useState<'draft' | 'published' | 'archived'>('published');

  // Form Fields
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

  // Author/Writer selection (for Admins)
  const [authors, setAuthors] = useState<AuthorProfile[]>([]);
  const [authorId, setAuthorId] = useState<string>(''); // '' = Editorial Desk

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Categories & Authors
  useEffect(() => {
    let isMounted = true;
    async function loadCats() {
      setLoadingCats(true);
      setCatError('');
      try {
        const cats = await newsService.getCategories();
        if (isMounted) {
          setCategories(cats);
          if (cats.length > 0 && !isEditMode) {
            setCategoryId(cats[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        if (isMounted) {
          setCatError('Failed to load categories from database.');
        }
      } finally {
        if (isMounted) {
          setLoadingCats(false);
        }
      }
    }

    async function loadAuthors() {
      if (!isAuthorOrWriter) {
        const list = await getArticleAuthors();
        if (isMounted) setAuthors(list);
      }
    }

    loadCats();
    loadAuthors();
    return () => {
      isMounted = false;
    };
  }, [isAuthorOrWriter, isEditMode]);

  // Load existing article data in Edit mode
  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setLoadingArticle(false);
      return;
    }

    async function loadArticle() {
      setLoadingArticle(true);
      setError('');
      try {
        const art = await newsService.getArticleById(id!);
        if (!isMounted) return;

        if (!art) {
          setError('Article not found or you do not have permission to view it.');
          setLoadingArticle(false);
          return;
        }

        // Enforce Author/Writer ownership permissions
        if (isAuthorOrWriter && effectiveUserId && art.authorId && art.authorId !== effectiveUserId) {
          setPermissionDenied(true);
          setError('Permission Denied: You can only edit articles that you have authored.');
          setLoadingArticle(false);
          return;
        }

        setOriginalArticle(art);
        setTitleEn(art.titleEn || '');
        setTitleHi(art.titleHi || '');
        setExcerptEn(art.excerptEn || '');
        setExcerptHi(art.excerptHi || '');
        setContentEn(art.contentEn || '');
        setContentHi(art.contentHi || '');
        if (art.categoryId) setCategoryId(art.categoryId);
        if (art.state) setState(art.state);
        if (art.city) setCity(art.city);
        if (art.imageUrl) {
          setImageUrl(art.imageUrl);
          setImagePreview(art.imageUrl);
        }
        if (art.videoUrl) setVideoUrl(art.videoUrl);
        setIsBreaking(Boolean(art.isBreaking));
        setIsTrending(Boolean(art.isTrending));
        setIsFeatured(Boolean(art.isFeatured));
        if (art.authorId) setAuthorId(art.authorId);
        if (art.status) setExistingStatus(art.status);
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load article details.');
        }
      } finally {
        if (isMounted) {
          setLoadingArticle(false);
        }
      }
    }

    loadArticle();
    return () => {
      isMounted = false;
    };
  }, [id, isAuthorOrWriter, effectiveUserId]);

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

    if (permissionDenied) {
      setError('Permission Denied: You cannot save changes to this article.');
      return;
    }

    if (!titleEn.trim() || !contentEn.trim()) {
      setError('Please provide at least an English title and content body.');
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl.trim();

      // Validate pasted URL before using it if no file was uploaded
      if (finalImageUrl && !imageFile) {
        try {
          const parsed = new URL(finalImageUrl);
          if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            setError('Image URL must start with https:// or http://');
            setSubmitting(false);
            return;
          }
        } catch {
          setError('Please enter a valid image URL (e.g. https://example.com/image.jpg)');
          setSubmitting(false);
          return;
        }
      }

      // If an image file was selected, upload it to Supabase Storage 'news-images'
      if (imageFile) {
        setUploadingImage(true);
        const { url: uploadedUrl, error: uploadErr } = await newsService.uploadNewsImage(imageFile);
        setUploadingImage(false);

        if (uploadErr || !uploadedUrl) {
          setError(uploadErr ?? 'Image upload failed — no URL returned. Check the Supabase Storage bucket and RLS policies.');
          setSubmitting(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      const selectedCat = categories.find((c) => c.id === categoryId);

      // Resolve author based on role and operation mode
      let resolvedAuthorId: string | null = null;
      let authorName: string;
      let authorAvatar: string;
      let authorRoleLabel: string;

      if (isAuthorOrWriter && effectiveUserId) {
        // Author / Writer: retain their own author_id
        resolvedAuthorId = effectiveUserId;
        authorName = user?.fullName || 'Author';
        authorAvatar = user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;
        authorRoleLabel = currentRole === 'author' ? 'Author' : 'Writer';
      } else {
        // Admin: use author dropdown or Editorial Desk
        const selectedAuthor = authors.find((a) => a.id === authorId);
        if (selectedAuthor) {
          authorName = selectedAuthor.fullName;
          authorAvatar =
            selectedAuthor.avatarUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedAuthor.fullName)}`;
          authorRoleLabel = selectedAuthor.role === 'author' ? 'Author' : 'Writer';
          resolvedAuthorId = selectedAuthor.id;
        } else if (isEditMode && originalArticle?.authorId && !authorId) {
          // If editing as admin and authorId was preserved from article
          resolvedAuthorId = null; // Admin explicitly set to Editorial Desk
          authorName = 'Editorial Desk';
          authorAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200';
          authorRoleLabel = 'Chief Editor';
        } else {
          authorName = 'Editorial Desk';
          authorAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200';
          authorRoleLabel = 'Chief Editor';
          resolvedAuthorId = null;
        }
      }

      const calculatedReadTime = Math.max(1, Math.ceil(contentEn.trim().split(/\s+/).length / 180));

      if (isEditMode && id) {
        // ── EDIT EXISTING ARTICLE (Update public.news row) ─────────────────
        const updateResult = await newsService.updateArticle(id, {
          titleEn: titleEn.trim(),
          titleHi: titleHi.trim() || titleEn.trim(),
          excerptEn: excerptEn.trim() || titleEn.trim(),
          excerptHi: excerptHi.trim() || titleHi.trim() || titleEn.trim(),
          contentEn: contentEn.trim(),
          contentHi: contentHi.trim() || contentEn.trim(),
          categoryId: categoryId || (selectedCat ? selectedCat.id : ''),
          imageUrl: finalImageUrl,
          videoUrl: videoUrl.trim() || undefined,
          isTrending,
          isFeatured,
          state,
          city,
          status: existingStatus, // Keep existing published/draft status intact
          authorId: resolvedAuthorId ?? undefined,
        });

        if (updateResult.success) {
          setSuccess('Article updated successfully! Redirecting to articles list...');
          setTimeout(() => {
            navigate('/admin/articles');
          }, 1500);
        } else {
          setError(updateResult.error || 'Failed to update article. Please verify your connection and permissions.');
        }
      } else {
        // ── CREATE NEW ARTICLE (Insert into public.news) ────────────────────
        const slug = titleEn
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

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
            authorId: resolvedAuthorId || undefined,
            author: {
              name: authorName,
              avatar: authorAvatar,
              role: authorRoleLabel,
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
            readTimeMinutes: calculatedReadTime,
            tags: ['LateKhabar', selectedCat?.nameEn || 'News'],
          },
          resolvedAuthorId || undefined
        );

        if (created) {
          setSuccess('Article published successfully! Redirecting to articles list...');
          setTimeout(() => {
            navigate('/admin/articles');
          }, 1500);
        } else {
          setError('Failed to publish article. Please verify your connection and permissions.');
        }
      }
    } catch (err: any) {
      setError(err?.message || `An unexpected error occurred during ${isEditMode ? 'updating' : 'publishing'}.`);
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const currentLocation = LOCATIONS_DATA.find((l) => l.state === state) || LOCATIONS_DATA[0];

  if (loadingArticle) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm">Loading article data from Supabase...</p>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-[#1c1c1c] border border-red-800/60 rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Permission Denied</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            You do not have permission to edit this article. Staff authors and writers can only edit stories they have created.
          </p>
          <button
            onClick={() => navigate('/admin/articles')}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
          >
            Return to My Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <Edit3 size={24} />
            </div>
          ) : (
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <Upload size={24} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold font-headline-md text-white">
              {isEditMode ? 'Edit Article' : 'Publish New Article'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isEditMode
                ? 'Modify and update existing editorial news story in the Supabase database.'
                : 'Create and publish editorial news in English and Hindi directly into Supabase database.'}
            </p>
          </div>
        </div>
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
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 cursor-pointer"
              >
                {loadingCats ? (
                  <option value="" className="bg-gray-900 text-white">Loading categories...</option>
                ) : catError ? (
                  <option value="" className="bg-gray-900 text-white">{catError}</option>
                ) : categories.length === 0 ? (
                  <option value="" className="bg-gray-900 text-white">No categories found</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-gray-900 text-white">
                      {cat.nameEn} {cat.nameHi && cat.nameHi !== cat.nameEn ? `(${cat.nameHi})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">State / UT</label>
              <select
                value={state}
                onChange={(e) => {
                  const newState = e.target.value;
                  setState(newState);
                  const matchedLoc = LOCATIONS_DATA.find((l) => l.state === newState);
                  const firstCity = matchedLoc?.cities[0]?.nameEn || '';
                  setCity(firstCity);
                }}
                disabled={submitting}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 cursor-pointer"
              >
                {LOCATIONS_DATA.map((loc) => (
                  <option key={loc.state} value={loc.state} className="bg-gray-900 text-white">
                    {loc.state} {loc.stateHi ? `(${loc.stateHi})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={submitting || (currentLocation?.cities?.length ?? 0) === 0}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 cursor-pointer"
              >
                {!currentLocation || currentLocation.cities.length === 0 ? (
                  <option value="" className="bg-gray-900 text-white">No cities available</option>
                ) : (
                  currentLocation.cities.map((c) => (
                    <option key={c.nameEn} value={c.nameEn} className="bg-gray-900 text-white">
                      {c.nameEn} {c.nameHi ? `(${c.nameHi})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Author / Writer Selector (Admin only) */}
          {!isAuthorOrWriter && (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1.5">
                <UserCircle size={14} />
                Author / Writer Assignment
                <span className="text-gray-500 font-normal normal-case">(optional — select specific author or leave blank for Editorial Desk)</span>
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                disabled={submitting}
                className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg p-2.5 text-sm outline-none focus:border-primary disabled:opacity-60 cursor-pointer"
              >
                <option value="" className="bg-gray-900 text-white">— Editorial Desk (default) —</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id} className="bg-gray-900 text-white">
                    {a.fullName} ({a.role === 'author' ? 'Author' : 'Writer'})
                  </option>
                ))}
              </select>
              {authors.length === 0 && (
                <p className="text-[11px] text-gray-600 mt-1">
                  No Authors or Writers found. Assign the <code>author</code> or <code>writer</code> role to users in User Management first.
                </p>
              )}
            </div>
          )}
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
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setImageUrl(val);
                  // Validate URL format before updating preview
                  if (val) {
                    try {
                      const parsed = new URL(val);
                      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                        setImagePreview(val);
                        setImageFile(null);
                        setError('');
                      } else {
                        setError('Image URL must start with https:// or http://');
                      }
                    } catch {
                      setError('Please enter a valid image URL (e.g. https://example.com/image.jpg)');
                    }
                  } else {
                    setImagePreview('');
                    setError('');
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
                <span>
                  {uploadingImage
                    ? 'Uploading Image...'
                    : isEditMode
                    ? 'Updating Article...'
                    : 'Publishing Article...'}
                </span>
              </>
            ) : (
              <>
                {isEditMode ? <Edit3 size={16} /> : <Upload size={16} />}
                <span>{isEditMode ? 'Update Article' : 'Publish Article'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleUpload;
