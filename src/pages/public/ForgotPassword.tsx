import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  React.useEffect(() => {
    document.title = "Forgot Password | Late Khabar";
  }, []);

  const handleSupabaseError = (err: unknown): string => {
    if (!err) return t('networkError');
    const asErr = err as { message?: string; code?: string; toString?: () => string };
    const msg = (asErr.message || (typeof err === 'object' ? '' : String(err)) || '').toLowerCase();
    const code = (asErr.code || '').toLowerCase();

    if (msg.includes('user not found') || code === 'user_not_found') {
      return t('userNotFound');
    }

    if (msg.includes('invalid email') || msg.includes('unable to validate email') || code === 'invalid_email') {
      return t('invalidEmail');
    }

    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection')) {
      return t('networkError');
    }

    return asErr.message || t('networkError');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError(t('fillAllFields'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t('invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const { error: resetErr } = await resetPassword(email.trim());
      if (resetErr) {
        setError(handleSupabaseError(resetErr));
      } else {
        setSuccessMessage(t('resetPasswordSent'));
      }
    } catch (err: unknown) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
        {/* Brand Logo & Title */}
        <div className="space-y-3 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Late Khabar" className="h-20 w-auto object-contain drop-shadow-md" />
          <h2 className="text-xl font-bold font-headline-md text-on-surface dark:text-white">
            {t('forgotPasswordTitle')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-article-body">
            {t('forgotPasswordSubtitle')}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('email')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container disabled:opacity-60 transition-all shadow-md mt-1 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('sendingResetLink')}</span>
              </>
            ) : (
              <span>{t('sendResetLink')}</span>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="pt-2 text-center text-xs border-t border-gray-100 dark:border-gray-800">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline">
            <ArrowLeft size={14} />
            <span>{t('backToLogin')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
