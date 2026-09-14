import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Bookmark, Clock } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  variant?: 'grid' | 'horizontal';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'grid' }) => {
  const { language, t } = useLanguage();
  const { savedArticleIds, toggleSaveArticle } = useAuth();
  const isSaved = savedArticleIds.includes(article.id);

  const title = language === 'hi' ? article.titleHi : article.titleEn;
  const excerpt = language === 'hi' ? article.excerptHi : article.excerptEn;
  const categoryName = language === 'hi' ? article.categoryNameHi : article.categoryNameEn;

  if (variant === 'horizontal') {
    return (
      <article className="flex gap-4 p-3 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
        <Link to={`/article/${article.slug}`} className="w-28 h-24 flex-shrink-0 overflow-hidden rounded-md">
          <img
            src={article.imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200';
            }}
          />
        </Link>
        <div className="flex flex-col justify-between flex-grow">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary dark:text-primary-fixed">
              {categoryName}
            </span>
            <Link to={`/article/${article.slug}`}>
              <h3 className="text-sm font-bold font-headline-md text-on-surface dark:text-white group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                {title}
              </h3>
            </Link>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.readTimeMinutes} {t('minsRead')}
            </span>
            <button
              onClick={() => toggleSaveArticle(article.id)}
              className="hover:text-primary transition-colors p-1"
            >
              <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col h-full rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all overflow-hidden group">
      <div className="relative h-48 w-full overflow-hidden">
        <Link to={`/article/${article.slug}`}>
          <img
            src={article.imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200';
            }}
          />
        </Link>
        <button
          onClick={() => toggleSaveArticle(article.id)}
          className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-all ${
            isSaved ? 'bg-primary text-white' : 'bg-black/40 text-white hover:bg-black/70'
          }`}
        >
          <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow gap-2">
        <div>
          <div className="flex items-center justify-between text-xs text-primary dark:text-primary-fixed font-bold uppercase tracking-wider mb-1">
            <span>{categoryName}</span>
            <span className="text-gray-400 font-normal normal-case">
              {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          </div>

          <Link to={`/article/${article.slug}`}>
            <h2 className="text-base font-bold font-headline-md text-on-surface dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {title}
            </h2>
          </Link>

          <p className="text-xs text-secondary dark:text-gray-300 font-article-body line-clamp-2 mt-2 leading-relaxed">
            {excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
          <span>{article.author.name}</span>
          <span>{article.readTimeMinutes} {t('minsRead')}</span>
        </div>
      </div>
    </article>
  );
};
