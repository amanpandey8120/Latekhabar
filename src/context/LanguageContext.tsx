import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from '../types';

interface Dictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const TRANSLATIONS: Dictionary = {
  // Navigation
  appName: { en: 'Late Khabar', hi: 'लेट ख़बर' },
  tagline: { en: 'Modern Editorialism & Independent Journalism', hi: 'आधुनिक पत्रकारिता और निष्पक्ष समाचार' },
  breaking: { en: 'Breaking', hi: 'ब्रेकिंग न्यूज़' },
  national: { en: 'National', hi: 'राष्ट्रीय' },
  international: { en: 'International', hi: 'अंतरराष्ट्रीय' },
  business: { en: 'Business', hi: 'व्यापार' },
  sports: { en: 'Sports', hi: 'खेल' },
  entertainment: { en: 'Entertainment', hi: 'मनोरंजन' },
  tech: { en: 'Technology', hi: 'तकनीक' },
  environment: { en: 'Environment', hi: 'पर्यावरण' },
  localNews: { en: 'Local News', hi: 'स्थानीय समाचार' },
  trending: { en: 'Trending News', hi: 'ट्रेंडिंग ख़बरें' },

  // Actions & UI Controls
  search: { en: 'Search news...', hi: 'समाचार खोजें...' },
  searchTitle: { en: 'Search & Filter News', hi: 'खोज और फ़िल्टर करें' },
  login: { en: 'Sign In', hi: 'साइन इन' },
  logout: { en: 'Sign Out', hi: 'साइन आउट' },
  profile: { en: 'My Profile', hi: 'मेरी प्रोफाइल' },
  savedNews: { en: 'Saved Stories', hi: 'सहेजे गए लेख' },
  onboarding: { en: 'Preferences', hi: 'प्राथमिकताएं' },
  adminPanel: { en: 'Admin Panel', hi: 'एडमिन पैनल' },
  language: { en: 'EN / HI', hi: 'हिन्दी / EN' },

  // Homepage Headings
  topStories: { en: 'Top Stories & Analysis', hi: 'प्रमुख समाचार और विश्लेषण' },
  multimedia: { en: 'Video & Audio Reports', hi: 'वीडियो और ऑडियों रिपोर्ट' },
  localCoverage: { en: 'Regional & City Coverage', hi: 'राज्य एवं शहर समाचार' },
  readMore: { en: 'Read Full Story', hi: 'पूरा पढ़ें' },
  minsRead: { en: 'min read', hi: 'मिनट पठन' },
  share: { en: 'Share', hi: 'शेयर करें' },
  save: { en: 'Save', hi: 'सहेजें' },
  saved: { en: 'Saved', hi: 'सहेजा गया' },

  // Admin Dashboard
  adminDashboard: { en: 'Admin Dashboard', hi: 'एडमिन डैशबोर्ड' },
  articlesPublished: { en: 'Published Articles', hi: 'प्रकाशित लेख' },
  totalViews: { en: 'Total Readers', hi: 'कुल पाठक' },
  videoReports: { en: 'Video Reports', hi: 'वीडियो रिपोर्ट' },
  createNewArticle: { en: 'Publish New Article', hi: 'नया लेख प्रकाशित करें' },
  manageNews: { en: 'Manage News', hi: 'समाचार प्रबंधन' },
  categoryManagement: { en: 'Categories', hi: 'श्रेणियां' },
  userManagement: { en: 'Users & Roles', hi: 'उपयोगकर्ता एवं भूमिकाएं' },

  // States & Placeholders
  loading: { en: 'Loading latest coverage...', hi: 'ताज़ा समाचार लोड हो रहे हैं...' },
  noResults: { en: 'No articles match your criteria', hi: 'आपकी खोज से संबंधित कोई लेख नहीं मिला' },
  errorTitle: { en: 'Unable to load news stream', hi: 'समाचार लोड करने में असमर्थ' },
  retry: { en: 'Try Again', hi: 'पुनः प्रयास करें' },
  pageNotFound: { en: '404 - Page Not Found', hi: '404 - पृष्ठ नहीं मिला' },
  backToHome: { en: 'Return to Homepage', hi: 'मुख्य पृष्ठ पर वापस जाएं' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('latekhabar_lang');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('latekhabar_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    if (!TRANSLATIONS[key]) return key;
    return TRANSLATIONS[key][language] || TRANSLATIONS[key]['en'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
