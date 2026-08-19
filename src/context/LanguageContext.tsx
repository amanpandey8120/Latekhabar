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
  signup: { en: 'Sign Up', hi: 'साइन अप' },
  logout: { en: 'Sign Out', hi: 'साइन आउट' },
  profile: { en: 'My Profile', hi: 'मेरी प्रोफाइल' },
  savedNews: { en: 'Saved Stories', hi: 'सहेजे गए लेख' },
  onboarding: { en: 'Preferences', hi: 'प्राथमिकताएं' },
  adminPanel: { en: 'Admin Panel', hi: 'एडमिन पैनल' },
  language: { en: 'EN / HI', hi: 'हिन्दी / EN' },

  // Authentication & Signup
  createAccount: { en: 'Create Your Account', hi: 'अपना खाता बनाएं' },
  joinLateKhabar: { en: 'Join Late Khabar to personalize your news feed and save stories.', hi: 'लेट ख़बर से जुड़ें, समाचारों को व्यक्तिगत बनाएं और लेख सहेजें।' },
  fullName: { en: 'Full Name', hi: 'पूरा नाम' },
  fullNamePlaceholder: { en: 'Enter your full name', hi: 'अपना पूरा नाम दर्ज करें' },
  email: { en: 'Email Address', hi: 'ईमेल पता' },
  emailPlaceholder: { en: 'Enter your email', hi: 'अपना ईमेल दर्ज करें' },
  password: { en: 'Password', hi: 'पासवर्ड' },
  passwordPlaceholder: { en: 'Create a password (min. 6 characters)', hi: 'पासवर्ड बनाएं (न्यूनतम 6 अक्षर)' },
  confirmPassword: { en: 'Confirm Password', hi: 'पासवर्ड की पुष्टि करें' },
  confirmPasswordPlaceholder: { en: 'Re-enter your password', hi: 'अपना पासवर्ड पुनः दर्ज करें' },
  alreadyHaveAccount: { en: 'Already have an account?', hi: 'क्या आपके पास पहले से एक खाता है?' },
  dontHaveAccount: { en: 'Don\'t have an account?', hi: 'खाता नहीं है?' },
  forgotPassword: { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  loggingIn: { en: 'Signing in...', hi: 'साइन इन हो रहा है...' },
  loginSuccess: { en: 'Login successful! Redirecting...', hi: 'साइन इन सफल! पुनः प्रेषित किया जा रहा है...' },
  signupSuccess: { en: 'Account created successfully! Redirecting...', hi: 'खाता सफलतापूर्वक बन गया! पुनः प्रेषित किया जा रहा है...' },
  creatingAccount: { en: 'Creating account...', hi: 'खाता बनाया जा रहा है...' },
  passwordsDoNotMatch: { en: 'Passwords do not match.', hi: 'पासवर्ड मेल नहीं खाते।' },
  invalidEmail: { en: 'Please enter a valid email address.', hi: 'कृपया एक वैध ईमेल पता दर्ज करें।' },
  passwordTooShort: { en: 'Password must be at least 6 characters.', hi: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' },
  fillAllFields: { en: 'Please fill in all required fields.', hi: 'कृपया सभी आवश्यक फ़ील्ड भरें।' },
  emailInUse: { en: 'An account with this email already exists.', hi: 'इस ईमेल का खाता पहले से मौजूद है।' },
  invalidCredentials: { en: 'Invalid email or password.', hi: 'अमान्य ईमेल या पासवर्ड।' },
  userNotFound: { en: 'No user account found with this email.', hi: 'इस ईमेल से कोई उपयोगकर्ता खाता नहीं मिला।' },
  // Password Reset Flow
  forgotPasswordTitle: { en: 'Forgot Your Password?', hi: 'क्या आप अपना पासवर्ड भूल गए हैं?' },
  forgotPasswordSubtitle: { en: 'Enter your email address and we will send you a link to reset your password.', hi: 'अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे।' },
  sendResetLink: { en: 'Send Reset Link', hi: 'रीसेट लिंक भेजें' },
  sendingResetLink: { en: 'Sending reset link...', hi: 'रीसेट लिंक भेजा जा रहा है...' },
  backToLogin: { en: 'Back to Sign In', hi: 'साइन इन पर वापस जाएं' },
  resetPasswordTitle: { en: 'Set New Password', hi: 'नया पासवर्ड सेट करें' },
  resetPasswordSubtitle: { en: 'Please enter your new password below.', hi: 'कृपया नीचे अपना नया पासवर्ड दर्ज करें।' },
  newPassword: { en: 'New Password', hi: 'नया पासवर्ड' },
  newPasswordPlaceholder: { en: 'Enter new password (min. 6 characters)', hi: 'नया पासवर्ड दर्ज करें (न्यूनतम 6 अक्षर)' },
  updatePasswordButton: { en: 'Update Password', hi: 'पासवर्ड अपडेट करें' },
  updatingPassword: { en: 'Updating password...', hi: 'पासवर्ड अपडेट हो रहा है...' },
  passwordUpdatedSuccess: { en: 'Password updated successfully! Redirecting to login...', hi: 'पासवर्ड सफलतापूर्वक अपडेट हो गया! लॉगिन पर पुनः प्रेषित किया जा रहा है...' },
  invalidOrExpiredResetLink: { en: 'Invalid or expired password reset link. Please request a new link.', hi: 'अमान्य या समाप्त हो चुका पासवर्ड रीसेट लिंक। कृपया नया लिंक अनुरोध करें।' },
  // Profile Management
  editProfile: { en: 'Edit Profile Information', hi: 'प्रोफाइल जानकारी संपादित करें' },
  profileUpdatedSuccess: { en: 'Profile updated successfully!', hi: 'प्रोफाइल सफलतापूर्वक अपडेट हो गई!' },
  updatingProfile: { en: 'Saving changes...', hi: 'बदलाव सहेजे जा रहे हैं...' },
  saveChanges: { en: 'Save Changes', hi: 'बदलाव सहेजें' },
  changePhoto: { en: 'Change Photo', hi: 'फोटो बदलें' },
  uploadingPhoto: { en: 'Uploading photo...', hi: 'फोटो अपलोड हो रही है...' },
  invalidImageType: { en: 'Please select a valid image file (JPEG, PNG, WebP).', hi: 'कृपया एक वैध छवि फ़ाइल (JPEG, PNG, WebP) चुनें।' },
  imageTooLarge: { en: 'Image size should be less than 5MB.', hi: 'छवि का आकार 5MB से कम होना चाहिए।' },
  state: { en: 'State', hi: 'राज्य' },
  city: { en: 'City', hi: 'शहर' },
  selectState: { en: 'Select State', hi: 'राज्य चुनें' },
  selectCity: { en: 'Select City', hi: 'शहर चुनें' },
  resetPasswordSent: { en: 'Password reset link sent to your email address.', hi: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।' },
  networkError: { en: 'Network error. Please check your connection.', hi: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।' },

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
