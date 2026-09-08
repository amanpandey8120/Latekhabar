import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Mail } from 'lucide-react';

const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ size?: number; className?: string }> = ({ size = 15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#181a1b] text-gray-300 border-t border-gray-800 mt-16 py-12">
      <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="space-y-4 sm:col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center" aria-label="Late Khabar Home">
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

        {/* Contact & Social Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-metadata">
            {t('contact')}
          </h4>
          <ul className="space-y-2.5 text-xs font-article-body">
            <li>
              <a
                href="mailto:latekhabarrewa@gmail.com"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
                aria-label="Send email to Late Khabar at latekhabarrewa@gmail.com"
              >
                <Mail size={15} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
                <span className="truncate">latekhabarrewa@gmail.com</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/latekhabar?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
                aria-label="Follow Late Khabar on Instagram"
              >
                <InstagramIcon size={15} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
                <span>Instagram</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/latekhabarrewa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
                aria-label="Follow Late Khabar on Facebook"
              >
                <FacebookIcon size={15} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
                <span>Facebook</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
