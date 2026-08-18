import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#181a1b] text-gray-300 border-t border-gray-800 mt-16 py-12">
      <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Late Khabar" className="h-12 w-auto object-contain" />
          </Link>
          <p className="text-xs text-gray-400 font-article-body leading-relaxed">
            {t('tagline')}
          </p>
          <p className="text-[11px] text-gray-500">
            © {new Date().getFullYear()} Late Khabar Media Inc. All rights reserved.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-metadata">
            {t('topStories')}
          </h4>
          <ul className="space-y-2 text-xs font-article-body">
            <li><Link to="/category/national" className="hover:text-primary transition-colors">{t('national')}</Link></li>
            <li><Link to="/category/international" className="hover:text-primary transition-colors">{t('international')}</Link></li>
            <li><Link to="/category/business" className="hover:text-primary transition-colors">{t('business')}</Link></li>
            <li><Link to="/category/sports" className="hover:text-primary transition-colors">{t('sports')}</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-metadata">
            Categories
          </h4>
          <ul className="space-y-2 text-xs font-article-body">
            <li><Link to="/category/entertainment" className="hover:text-primary transition-colors">{t('entertainment')}</Link></li>
            <li><Link to="/category/tech" className="hover:text-primary transition-colors">{t('tech')}</Link></li>
            <li><Link to="/category/environment" className="hover:text-primary transition-colors">{t('environment')}</Link></li>
            <li><Link to="/local" className="hover:text-primary transition-colors">{t('localNews')}</Link></li>
          </ul>
        </div>

        {/* Admin & Portal */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-metadata">
            Portal Links
          </h4>
          <ul className="space-y-2 text-xs font-article-body">
            <li><Link to="/login" className="hover:text-primary transition-colors">{t('login')}</Link></li>
            <li><Link to="/saved" className="hover:text-primary transition-colors">{t('savedNews')}</Link></li>
            <li><Link to="/admin/login" className="hover:text-primary transition-colors">{t('adminPanel')}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
