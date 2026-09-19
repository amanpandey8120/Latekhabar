import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const { user, signUpWithEmail } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    document.title = "Create Account | Late Khabar";
  }, []);

  // If already authenticated, redirect
  if (user && !success) {
    navigate('/profile');
  }

  const validateForm = (): boolean => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t('fillAllFields'));
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t('invalidEmail'));
      return false;
    }

    // Password length validation
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return false;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return false;
    }

    return true;
  };

  const handleSupabaseError = (err: unknown): string => {
    if (!err) return t('networkError');
    const asErr = err as { message?: string; code?: string };
    const msg = (asErr.message || '').toLowerCase();
    const code = (asErr.code || '').toLowerCase();

    if (
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('user_already_exists') ||
      code === 'user_already_exists' ||
      code === '23505'
    ) {
      return t('emailInUse');
    }

    if (msg.includes('weak_password') || msg.includes('at least 6 characters') || msg.includes('password should be')) {
      return t('passwordTooShort');
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
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { user: newUser, error: signUpError } = await signUpWithEmail(
        fullName.trim(),
        email.trim(),
        password
      );

      if (signUpError) {
        setError(handleSupabaseError(signUpError));
        setLoading(false);
        return;
      }

      if (newUser) {
        setSuccess(t('signupSuccess'));
        setTimeout(() => {
          navigate('/onboarding');
        }, 1500);
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
        {/* Header / Brand Logo */}
        <div className="space-y-3 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Late Khabar" className="h-20 w-auto object-contain drop-shadow-md" />
          <h2 className="text-xl font-bold font-headline-md text-on-surface dark:text-white">
            {t('createAccount')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-article-body">
            {t('joinLateKhabar')}
          </p>
        </div>

        {/* Status Alerts */}
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('fullName')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
              <User size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container disabled:opacity-60 transition-all shadow-md mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('creatingAccount')}</span>
              </>
            ) : (
              <span>{t('signup')}</span>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
          <span>{t('alreadyHaveAccount')} </span>
          <Link to="/login" className="text-primary font-bold hover:underline">
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
};
