import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 my-8">
      <AlertTriangle size={36} className="text-red-600 dark:text-red-400 mb-3" />
      <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">
        {t('errorTitle')}
      </h3>
      <p className="text-xs text-red-700 dark:text-red-300 max-w-md mb-4">
        {message || 'An unexpected error occurred while fetching news content.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container transition-colors shadow"
        >
          <RefreshCw size={14} />
          <span>{t('retry')}</span>
        </button>
      )}
    </div>
  );
};
