import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ── Recovery Session Verification ──────────────────────────────────────────
  useEffect(() => {
    document.title = "Reset Password | Late Khabar";
    let isMounted = true;

    const verifyRecoverySession = async () => {
      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setError('Supabase is not configured.');
          setVerifying(false);
          setHasValidSession(false);
        }
        return;
      }

      // 1. Check for error parameters in URL query or hash fragment
      const searchParams = new URLSearchParams(window.location.search);
      const hashContent = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashContent);

      const errorDescription =
        hashParams.get('error_description') ||
        searchParams.get('error_description') ||
        hashParams.get('error') ||
        searchParams.get('error');

      if (errorDescription) {
        if (isMounted) {
          const cleanError = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
          setError(cleanError || t('invalidOrExpiredResetLink'));
          setVerifying(false);
          setHasValidSession(false);
        }
        return;
      }

      // 2. Check for PKCE exchange code in search params (?code=...)
      const authCode = searchParams.get('code');
      if (authCode) {
        try {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeErr) {
            console.error('[ResetPassword] PKCE code exchange error:', exchangeErr);
          } else if (data.session) {
            if (isMounted) {
              setHasValidSession(true);
              setVerifying(false);
            }
            return;
          }
        } catch (err) {
          console.error('[ResetPassword] exchangeCode exception:', err);
        }
      }

      // 3. Check existing Supabase session
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (session && !sessionErr) {
        if (isMounted) {
          setHasValidSession(true);
          setVerifying(false);
        }
        return;
      }

      // 4. If hash contains access_token or recovery type, wait a brief interval for Supabase to finish parsing
      const hasTokenInHash = hashParams.has('access_token') || hashContent.includes('type=recovery');

      const timeoutId = setTimeout(async () => {
        if (!isMounted) return;
        const {
          data: { session: recheckSession },
        } = await supabase.auth.getSession();

        if (recheckSession) {
          setHasValidSession(true);
        } else {
          setHasValidSession(false);
          setError(t('invalidOrExpiredResetLink'));
        }
        setVerifying(false);
      }, hasTokenInHash ? 1200 : 500);

      return () => clearTimeout(timeoutId);
    };

    // 5. Auth State listener for PASSWORD_RECOVERY / SIGNED_IN events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session) || (session && event === 'USER_UPDATED')) {
        if (isMounted) {
          setHasValidSession(true);
          setVerifying(false);
          setError('');
        }
      }
    });

    const cleanup = verifyRecoverySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (typeof cleanup === 'function') {
        (cleanup as unknown as () => void)();
      }
    };
  }, [t]);

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

  const handleSupabaseError = (err: unknown): string => {
    if (!err) return t('networkError');
    const asErr = err as { message?: string; code?: string; toString?: () => string };
    const msg = (asErr.message || (typeof err === 'object' ? '' : String(err)) || '').toLowerCase();
    const code = (asErr.code || '').toLowerCase();

    if (
      msg.includes('auth session missing') ||
      msg.includes('jwt expired') ||
      msg.includes('invalid token') ||
      msg.includes('token has expired') ||
      code === 'session_not_found'
    ) {
      return t('invalidOrExpiredResetLink');
    }

    if (msg.includes('weak_password') || msg.includes('at least 6 characters') || msg.includes('password should be')) {
      return t('passwordTooShort');
    }

    if (msg.includes('same_password') || msg.includes('should be different')) {
      return 'New password should be different from your old password.';
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

    if (!hasValidSession) {
      setError(t('invalidOrExpiredResetLink'));
      return;
    }

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
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
            {t('resetPasswordTitle')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-article-body">
            {t('resetPasswordSubtitle')}
          </p>
        </div>

        {/* Verifying Session State */}
        {verifying ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('verifyingResetLink')}
            </p>
          </div>
        ) : !hasValidSession ? (
          /* Invalid or Expired Session Guard */
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-start gap-2.5 text-left">
              <AlertCircle size={18} className="flex-shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{error || t('invalidOrExpiredResetLink')}</p>
                <p className="text-[11px] opacity-90">
                  Password reset links are single-use and expire after a limited duration.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <Link
                to="/forgot-password"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-all shadow-md cursor-pointer"
              >
                {t('requestNewLink')}
              </Link>

              <div className="pt-2 text-center text-xs border-t border-gray-100 dark:border-gray-800">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline">
                  <ArrowLeft size={14} />
                  <span>{t('backToLogin')}</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Valid Session: Password Reset Form */
          <>
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

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('newPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('newPasswordPlaceholder')}
                    disabled={loading || Boolean(successMessage)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required
                    minLength={6}
                  />
                  <Lock size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmPasswordPlaceholder')}
                    disabled={loading || Boolean(successMessage)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required
                    minLength={6}
                  />
                  <ShieldCheck size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(successMessage)}
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
          </>
        )}
      </div>
    </div>
  );
};
