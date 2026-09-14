import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Bookmark, Clock } from 'lucide-react';

interface HeroCardProps {
  article: Article;
}

export const HeroCard: React.FC<HeroCardProps> = ({ article }) => {
  const { language, t } = useLanguage();
  const { savedArticleIds, toggleSaveArticle } = useAuth();
  const isSaved = savedArticleIds.includes(article.id);

  const title = language === 'hi' ? article.titleHi : article.titleEn;
  const excerpt = language === 'hi' ? article.excerptHi : article.excerptEn;
  const categoryName = language === 'hi' ? article.categoryNameHi : article.categoryNameEn;

  return (
    <article className="flex flex-col gap-4 cursor-pointer group bg-white dark:bg-[#1c1c1c] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
      <div className="relative w-full overflow-hidden rounded-lg">
        <Link to={`/article/${article.slug}`}>
          <img
            src={article.imageUrl}
            alt={title}
            className="w-full h-[360px] md:h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200';
            }}
          />
        </Link>
        {article.isBreaking && (
          <div className="absolute top-4 left-4 pulse-bg text-on-primary px-3 py-1 rounded-sm text-xs font-metadata uppercase tracking-wider font-bold shadow-md">
            {t('breaking')}
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleSaveArticle(article.id);
          }}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${
            isSaved ? 'bg-primary text-white' : 'bg-black/40 text-white hover:bg-black/70'
          }`}
          title={isSaved ? t('saved') : t('save')}
        >
          <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 text-xs font-metadata text-primary dark:text-primary-fixed uppercase tracking-wider font-semibold">
          <span>{categoryName}</span>
          <span className="text-gray-400">•</span>
          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 normal-case">
            <Clock size={13} />
            {article.readTimeMinutes} {t('minsRead')}
          </span>
        </div>

        <Link to={`/article/${article.slug}`}>
          <h1 className="text-2xl md:text-3xl font-headline-md font-bold text-on-background dark:text-white group-hover:text-primary transition-colors leading-tight">
            {title}
          </h1>
        </Link>

        <p className="text-sm font-article-body text-secondary dark:text-gray-300 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>

        <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <img src={article.author.avatar} alt={article.author.name} className="w-6 h-6 rounded-full object-cover" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">{article.author.name}</span>
          <span>•</span>
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </article>
  );
};
