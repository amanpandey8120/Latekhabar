import React from 'react';
import { Newspaper } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  title?: string;
  message?: string;
  /** Optional CTA element rendered below the message */
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low dark:bg-[#1e1e1e] rounded-lg border border-dashed border-gray-300 dark:border-gray-700 my-8">
      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-full text-primary mb-4">
        <Newspaper size={40} />
      </div>
      <h3 className="text-lg font-bold font-headline-md text-on-surface dark:text-white mb-2">
        {title || t('noResults')}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md font-article-body">
        {message || 'Try adjusting your search criteria or switching categories.'}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
