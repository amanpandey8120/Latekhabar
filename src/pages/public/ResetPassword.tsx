import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    if (!newPassword || !confirmPassword) {
      setError(t('fillAllFields'));
      return false;
    }

    if (newPassword.length < 6) {
      setError(t('passwordTooShort'));
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleSupabaseError = (err: any): string => {
    if (!err) return t('networkError');
    const msg = (err.message || err.toString() || '').toLowerCase();

    if (msg.includes('auth session missing') || msg.includes('jwt expired') || msg.includes('invalid token')) {
      return t('invalidOrExpiredResetLink');
    }

    if (msg.includes('weak_password') || msg.includes('at least 6 characters') || msg.includes('password should be')) {
      return t('passwordTooShort');
    }

    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection')) {
      return t('networkError');
    }

    return err.message || t('networkError');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: updateErr } = await updatePassword(newPassword);

      if (updateErr) {
        setError(handleSupabaseError(updateErr));
        setLoading(false);
        return;
      }

      setSuccessMessage(t('passwordUpdatedSuccess'));
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
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
            {t('resetPasswordTitle')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-article-body">
            {t('resetPasswordSubtitle')}
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

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('newPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
              <Lock size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
              <ShieldCheck size={16} className="absolute left-3.5 top-3 text-gray-400" />
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
                <span>{t('updatingPassword')}</span>
              </>
            ) : (
              <span>{t('updatePasswordButton')}</span>
            )}
          </button>
        </form>

        {/* Back to Login */}
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
