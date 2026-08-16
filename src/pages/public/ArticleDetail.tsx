import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Article } from '../../types';
import { newsService } from '../../services/newsService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ArticleCard } from '../../components/news/ArticleCard';
import { SkeletonHero } from '../../components/common/SkeletonLoader';
import { Bookmark, Share2, Volume2, Clock, Check, ArrowLeft } from 'lucide-react';

export const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const { savedArticleIds, toggleSaveArticle } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSizeClass, setFontSizeClass] = useState<'text-base' | 'text-lg' | 'text-xl'>('text-lg');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      setLoading(true);
      const art = await newsService.getArticleBySlug(slug);
      setArticle(art);

      if (art) {
        const allArts = await newsService.getArticles();
        setRelated(allArts.filter((a) => a.id !== art.id).slice(0, 3));
      }
      setLoading(false);
    }
    loadArticle();
  }, [slug]);

  if (loading) return <SkeletonHero />;
  if (!article) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold font-headline-md">Story Not Found</h2>
        <p className="text-sm text-gray-500">The story you are looking for does not exist or has been removed.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-primary text-white rounded text-sm font-semibold">
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const isSaved = savedArticleIds.includes(article.id);
  const title = language === 'hi' ? article.titleHi : article.titleEn;
  const content = language === 'hi' ? article.contentHi : article.contentEn;
  const categoryName = language === 'hi' ? article.categoryNameHi : article.categoryNameEn;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft size={14} /> Home
        </Link>
        <span>/</span>
        <Link to={`/category/${article.categoryId}`} className="hover:text-primary capitalize">
          {categoryName}
        </Link>
      </div>

      {/* Header section */}
      <div className="space-y-4">
        <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-950/60 text-primary dark:text-primary-fixed rounded-sm text-xs font-bold uppercase tracking-wider">
          {categoryName}
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline-md text-on-background dark:text-white leading-tight">
          {title}
        </h1>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-gray-200 dark:border-gray-800 text-xs font-metadata text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <img src={article.author.avatar} alt={article.author.name} className="w-10 h-10 rounded-full object-cover border border-gray-300" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{article.author.name}</p>
              <p className="text-[11px] text-gray-500">{article.author.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {article.readTimeMinutes} {t('minsRead')}
            </span>

            {/* Audio Listen */}
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isPlayingAudio ? 'bg-primary text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <Volume2 size={14} />
              <span>{isPlayingAudio ? 'Playing Audio...' : 'Listen'}</span>
            </button>

            {/* Font Size Adjusters */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-xs font-bold gap-1">
              <button
                onClick={() => setFontSizeClass('text-base')}
                className={`px-1.5 py-0.5 rounded ${fontSizeClass === 'text-base' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeClass('text-lg')}
                className={`px-1.5 py-0.5 rounded ${fontSizeClass === 'text-lg' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSizeClass('text-xl')}
                className={`px-1.5 py-0.5 rounded ${fontSizeClass === 'text-xl' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
              >
                A+
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => toggleSaveArticle(article.id)}
              className={`p-2 rounded-full transition-colors ${
                isSaved ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
              title={isSaved ? t('saved') : t('save')}
            >
              <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold transition-colors"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied' : t('share')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Media (Video Embed or Image) */}
      {article.videoUrl ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md">
          <iframe
            src={article.videoUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="space-y-2">
          <img
            src={article.imageUrl}
            alt={title}
            className="w-full max-h-[480px] object-cover rounded-xl shadow-sm"
          />
          {article.imageCaption && (
            <p className="text-xs text-gray-500 italic text-center font-article-body">
              {article.imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Article Body Content */}
      <div className={`font-article-body text-on-surface dark:text-gray-200 leading-relaxed space-y-6 ${fontSizeClass}`}>
        {content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="first-letter:text-4xl first-letter:font-bold first-letter:font-headline-md first-letter:mr-2 first-letter:float-left first-letter:text-primary">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs font-bold text-gray-500 uppercase">Tags:</span>
          {article.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-surface-container-low dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Stories */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="text-xl font-bold font-headline-md text-on-surface dark:text-white">
            Related News
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((art) => (
              <ArticleCard key={art.id} article={art} variant="grid" />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
