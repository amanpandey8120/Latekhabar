import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Newspaper } from 'lucide-react';

export const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 space-y-6">
      <div className="p-6 bg-red-50 dark:bg-red-950/40 text-primary rounded-full shadow-inner">
        <Newspaper size={64} />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-bold font-headline-md text-on-surface dark:text-white">
          404 - Page Not Found
        </h1>
        <p className="text-sm text-gray-500 font-article-body">
          The page or news story you are attempting to reach has moved or no longer exists in our archives.
        </p>
      </div>

      <Link
        to="/"
        className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container shadow-md transition-all"
      >
        {t('backToHome')}
      </Link>
    </div>
  );
};
