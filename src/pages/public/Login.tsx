import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, signInWithEmail, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    document.title = "Sign In | Late Khabar";
  }, []);

  if (user && !success) {
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
  }

  const handleSupabaseError = (err: unknown): string => {
    if (!err) return t('networkError');
    const asError = err as { message?: string; code?: string; toString?: () => string };
    const msg = (asError.message || (typeof err === 'object' ? '' : String(err)) || '').toLowerCase();
    const code = (asError.code || '').toLowerCase();

    if (
      msg.includes('invalid login credentials') ||
      msg.includes('invalid credentials') ||
      code === 'invalid_credentials'
    ) {
      return t('invalidCredentials');
    }

    if (msg.includes('user not found') || code === 'user_not_found') {
      return t('userNotFound');
    }

    if (msg.includes('invalid email') || msg.includes('unable to validate email') || code === 'invalid_email') {
      return t('invalidEmail');
    }

    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection')) {
      return t('networkError');
    }

    return asError.message || t('networkError');
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
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
      const { user: signedInUser, profile, error: signInErr } = await signInWithEmail(email.trim(), password);

      if (signInErr) {
        setError(handleSupabaseError(signInErr));
        setLoading(false);
        return;
      }

      if (signedInUser) {
        setSuccess(t('loginSuccess'));
        // Role comes exclusively from profile.role fetched from public.profiles — never from email
        const userRole = profile?.role ?? 'user';
        setTimeout(() => {
          if (userRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/profile');
          }
        }, 1200);
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
            {t('login')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-article-body">
            Sign in to personalize news feeds, save stories, and sync your reading list across devices.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}



        {/* Email & Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('password')} <span className="text-red-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
              <Lock size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container disabled:opacity-60 transition-all shadow-md mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('loggingIn')}</span>
              </>
            ) : (
              <span>{t('login')}</span>
            )}
          </button>
        </form>

        <div className="flex items-center my-2">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span className="px-3 text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Or</span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        {/* Action Options: Google Sign In & Demo Admin */}
        <div className="space-y-3 pt-1 text-center">
          <button
            onClick={async () => {
              await signInWithGoogle();
              navigate('/onboarding');
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold text-xs shadow-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Link to Signup */}
          <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{t('dontHaveAccount')} </span>
            <Link to="/signup" className="text-primary font-bold hover:underline">
              {t('signup')}
            </Link>
          </div>

          {/* Admin portal link */}
          <div className="pt-1 text-[11px] text-gray-400">
            Admin?{' '}
            <Link to="/admin/login" className="text-primary font-semibold hover:underline">
              Go to Admin Portal
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          By continuing, you agree to Late Khabar's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

