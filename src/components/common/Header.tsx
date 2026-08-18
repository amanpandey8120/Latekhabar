import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Search, Globe, Moon, Sun, User as UserIcon, LogOut, Bookmark, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { slug: 'national', key: 'national' },
    { slug: 'international', key: 'international' },
    { slug: 'business', key: 'business' },
    { slug: 'sports', key: 'sports' },
    { slug: 'entertainment', key: 'entertainment' },
    { slug: 'tech', key: 'tech' },
    { slug: 'environment', key: 'environment' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="fixed w-full top-8 z-50 bg-surface dark:bg-[#181818] border-b border-outline-variant dark:border-gray-800 flex flex-col items-center max-w-container-max mx-auto left-0 right-0 transition-colors duration-200">
      <div className="w-full flex justify-between items-center py-3.5 px-gutter">
        {/* Left Side: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface dark:text-gray-200 hover:text-primary transition-colors p-1"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Late Khabar" className="h-11 md:h-13 w-auto object-contain drop-shadow-sm" />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {categories.map((cat) => {
            const isActive = location.pathname === `/category/${cat.slug}`;
            return (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`text-nav-link font-nav-link text-sm font-medium transition-colors duration-200 pb-1 ${
                  isActive
                    ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed font-bold'
                    : 'text-on-surface dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed'
                }`}
              >
                {t(cat.key)}
              </Link>
            );
          })}
          <Link
            to="/local"
            className={`text-nav-link font-nav-link text-sm font-medium transition-colors duration-200 pb-1 ${
              location.pathname === '/local'
                ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed font-bold'
                : 'text-on-surface dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed'
            }`}
          >
            {t('localNews')}
          </Link>
        </div>

        {/* Right Side Controls: Search, Language, Theme, Auth */}
        <div className="flex items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="border-b border-outline-variant dark:border-gray-700 focus:border-primary dark:focus:border-primary-container outline-none bg-transparent py-1 pl-2 pr-8 text-sm font-article-body w-40 sm:w-48 focus:w-60 transition-all duration-200 text-on-surface dark:text-gray-100 placeholder-on-surface-variant dark:placeholder-gray-500"
            />
            <button type="submit" className="absolute right-1 top-1.5 text-on-surface-variant dark:text-gray-400 hover:text-primary">
              <Search size={16} />
            </button>
          </form>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title="Switch Language (EN / HI)"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface dark:text-gray-200 transition-colors text-xs font-semibold uppercase tracking-wider"
          >
            <Globe size={16} className="text-primary dark:text-primary-fixed" />
            <span>{language === 'en' ? 'EN' : 'हिन्दी'}</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle Light / Dark Mode"
            className="p-1.5 rounded-full hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface dark:text-gray-200 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* User Account / Profile Menu */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover border border-outline-variant"
                />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
              >
                <UserIcon size={14} />
                <span>{t('login')}</span>
              </Link>
            )}

            {/* Dropdown Menu */}
            {userDropdownOpen && user && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#222222] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded">
                    {user.role}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <UserIcon size={16} />
                  <span>{t('profile')}</span>
                </Link>

                <Link
                  to="/saved"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Bookmark size={16} />
                  <span>{t('savedNews')}</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary dark:text-primary-container font-semibold hover:bg-red-50 dark:hover:bg-gray-800"
                  >
                    <Shield size={16} />
                    <span>{t('adminPanel')}</span>
                  </Link>
                )}

                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 text-left"
                >
                  <LogOut size={16} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Scroll Category Ribbon */}
      <div className="w-full md:hidden flex overflow-x-auto gap-4 py-2 px-gutter border-t border-gray-200 dark:border-gray-800 hide-scrollbar bg-surface dark:bg-[#181818]">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className="text-xs font-semibold text-on-surface dark:text-gray-300 hover:text-primary whitespace-nowrap px-2 py-1 rounded bg-surface-container-low dark:bg-gray-800"
          >
            {t(cat.key)}
          </Link>
        ))}
        <Link
          to="/local"
          className="text-xs font-semibold text-on-surface dark:text-gray-300 hover:text-primary whitespace-nowrap px-2 py-1 rounded bg-surface-container-low dark:bg-gray-800"
        >
          {t('localNews')}
        </Link>
      </div>

      {/* Mobile Expandable Menu Drawer */}
      {mobileMenuOpen && (
        <div className="w-full md:hidden bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 px-gutter py-4 flex flex-col gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="w-full border border-gray-300 dark:border-gray-700 rounded py-2 pl-3 pr-10 text-sm bg-transparent dark:text-white"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-500">
              <Search size={18} />
            </button>
          </form>

          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-800 dark:text-gray-200 py-1.5 border-b border-gray-100 dark:border-gray-800"
            >
              {t(cat.key)}
            </Link>
          ))}
          <Link
            to="/local"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-gray-800 dark:text-gray-200 py-1.5 border-b border-gray-100 dark:border-gray-800"
          >
            {t('localNews')}
          </Link>
        </div>
      )}
    </nav>
  );
};
