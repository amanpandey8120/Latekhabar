import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import { Bookmark, Settings, Shield, Globe, Moon } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, signOut, savedArticleIds } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold font-headline-md">Please Sign In</h2>
        <p className="text-xs text-gray-500">Sign in to view your profile and saved bookmarks.</p>
        <Link to="/login" className="inline-block px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold">
          {t('login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user.avatarUrl}
          alt={user.fullName}
          className="w-20 h-20 rounded-full object-cover border-2 border-primary"
        />
        <div className="space-y-1 text-center sm:text-left flex-grow">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold font-headline-md text-on-surface dark:text-white">
              {user.fullName}
            </h1>
            <span className="px-2.5 py-0.5 bg-red-100 dark:bg-red-950 text-primary dark:text-primary-fixed rounded text-[10px] uppercase font-bold tracking-wider">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400">
            Location: {user.city || 'New Delhi'}, {user.state || 'Delhi'}
          </p>
        </div>

        {user.role === 'admin' && (
          <Link
            to="/admin"
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Shield size={16} />
            Admin Portal
          </Link>
        )}
      </div>

      {/* Preferences & Settings */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-on-surface dark:text-white flex items-center gap-2">
          <Settings size={20} className="text-primary" />
          Reading Preferences & Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language Preference */}
          <div className="p-4 rounded-xl bg-surface-container-low dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-primary" />
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Default Language</p>
                <p className="text-[11px] text-gray-500">{language === 'en' ? 'English' : 'हिंदी'}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
              className="text-xs font-semibold p-1.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          {/* Theme Preference */}
          <div className="p-4 rounded-xl bg-surface-container-low dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-primary" />
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Display Theme</p>
                <p className="text-[11px] text-gray-500 capitalize">{theme} Mode</p>
              </div>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="text-xs font-semibold p-1.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <Link to="/saved" className="text-xs font-bold text-primary flex items-center gap-1">
            <Bookmark size={16} /> View {savedArticleIds.length} Saved Stories
          </Link>

          <button
            onClick={signOut}
            className="px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
