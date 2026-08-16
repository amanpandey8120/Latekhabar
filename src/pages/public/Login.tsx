import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, signInWithGoogle, signInAsAdminMock } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/profile');
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6 text-center">
        {/* Brand Logo & Title */}
        <div className="space-y-2">
          <span className="text-4xl font-display-lg font-bold text-primary dark:text-primary-container">
            Late Khabar
          </span>
          <h2 className="text-xl font-bold font-headline-md text-on-surface dark:text-white">
            Welcome to Modern Editorialism
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-article-body">
            Sign in to personalize news feeds, save stories, and sync your reading list across devices.
          </p>
        </div>

        {/* Features bullet points */}
        <div className="bg-surface-container-low dark:bg-gray-800/50 rounded-xl p-4 text-left space-y-3 border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-200">
            <Sparkles size={16} className="text-primary flex-shrink-0" />
            <span>Personalized topic & location news updates</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-200">
            <UserCheck size={16} className="text-primary flex-shrink-0" />
            <span>Save articles to read offline anytime</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-200">
            <ShieldCheck size={16} className="text-primary flex-shrink-0" />
            <span>Fast, safe Google Authentication</span>
          </div>
        </div>

        {/* Primary Action: Google Sign In */}
        <div className="space-y-3 pt-2">
          <button
            onClick={async () => {
              await signInWithGoogle();
              navigate('/onboarding');
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold text-sm shadow-sm transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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

          {/* Quick Admin Test Login */}
          <button
            onClick={() => {
              signInAsAdminMock();
              navigate('/admin');
            }}
            className="w-full text-xs text-primary font-semibold hover:underline py-1"
          >
            Demo Admin Sign In (Fast Test Mode)
          </button>
        </div>

        <p className="text-[11px] text-gray-400">
          By continuing, you agree to Late Khabar's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
