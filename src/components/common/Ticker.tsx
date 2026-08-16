import React from 'react';
import type { Article } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

interface TickerProps {
  breakingArticles: Article[];
}

export const Ticker: React.FC<TickerProps> = ({ breakingArticles }) => {
  const { language, t } = useLanguage();

  if (!breakingArticles || breakingArticles.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[60] bg-primary text-on-primary shadow-sm">
      <div className="flex items-center px-gutter max-w-container-max mx-auto h-8 text-metadata font-metadata uppercase tracking-wider">
        <span className="pulse-bg px-2 py-0.5 mr-3 rounded-sm font-bold shadow-sm whitespace-nowrap text-xs">
          {t('breaking')}
        </span>
        <div className="ticker-wrap flex-grow bg-transparent overflow-hidden relative">
          <div className="ticker pl-full text-xs md:text-sm font-medium">
            {breakingArticles.map((art, idx) => (
              <React.Fragment key={art.id}>
                <Link
                  to={`/article/${art.slug}`}
                  className="hover:underline transition-opacity duration-150 inline-block mr-6"
                >
                  {language === 'hi' ? art.titleHi : art.titleEn}
                </Link>
                {idx < breakingArticles.length - 1 && <span className="mr-6 opacity-60">•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
