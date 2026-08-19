import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { LOCATIONS_DATA } from '../../lib/mockData';
import {
  Bookmark,
  Shield,
  Globe,
  Moon,
  Sun,
  Camera,
  User,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Save,
  ChevronDown,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, signOut, savedArticleIds, updateProfile, uploadAvatarFile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Sync form state when user profile loads
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setSelectedState(user.state || '');
      setSelectedCity(user.city || '');
      setSelectedLanguage(user.language || 'en');
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user]);

  // Available cities for selected state
  const availableCities = LOCATIONS_DATA.find((l) => l.state === selectedState)?.cities || [];

  // When state changes, reset city if it's not in new state's list
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setSelectedCity('');
  };

  // Avatar picker
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setAvatarError(t('invalidImageType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(t('imageTooLarge'));
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg('');
    setSuccessMsg('');
    setAvatarError('');
    setSaving(true);

    try {
      let newAvatarUrl: string | undefined = undefined;

      // Upload avatar if a new file was chosen
      if (avatarFile) {
        setUploadingAvatar(true);
        const { url, error: uploadErr } = await uploadAvatarFile(avatarFile);
        setUploadingAvatar(false);

        if (uploadErr) {
          const msg = uploadErr.message || '';
          if (msg.includes('Invalid image')) {
            setAvatarError(t('invalidImageType'));
          } else if (msg.includes('exceeds 5MB')) {
            setAvatarError(t('imageTooLarge'));
          } else {
            setAvatarError(msg || t('networkError'));
          }
          setSaving(false);
          return;
        }

        if (url) newAvatarUrl = url;
      }

      const updates: any = {
        fullName: fullName.trim() || user.fullName,
        language: selectedLanguage,
        state: selectedState || undefined,
        city: selectedCity || undefined,
      };
      if (newAvatarUrl) updates.avatarUrl = newAvatarUrl;

      const { error: updateErr } = await updateProfile(updates);
      if (updateErr) {
        setErrorMsg(updateErr.message || t('networkError'));
        return;
      }

      // Also sync LanguageContext with chosen language
      setLanguage(selectedLanguage);
      setAvatarFile(null);
      setSuccessMsg(t('profileUpdatedSuccess'));

      // Auto-clear success message
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || t('networkError'));
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* ── PROFILE HEADER CARD ── */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Cover banner */}
        <div className="h-24 bg-gradient-to-r from-primary via-red-500 to-orange-500 relative" />

        <div className="px-6 pb-6">
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
            {/* Avatar with upload overlay */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1c1c1c] overflow-hidden bg-primary/10 shadow-md">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={() =>
                      setAvatarPreview(
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`
                      )
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              {/* Camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={t('changePhoto')}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-grow text-center sm:text-left sm:pb-1 space-y-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-bold font-headline-md text-on-surface dark:text-white leading-tight">
                  {user.fullName}
                </h1>
                <span
                  className={`self-center sm:self-auto px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <Mail size={12} />
                {user.email}
              </p>
              {(user.state || user.city) && (
                <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin size={12} />
                  {[user.city, user.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Admin shortcut */}
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow hover:bg-red-700 transition-colors"
              >
                <Shield size={14} />
                Admin Portal
              </Link>
            )}
          </div>

          {/* Avatar upload error */}
          {avatarError && (
            <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              {avatarError}
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT FORM ── */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-on-surface dark:text-white flex items-center gap-2">
          <User size={18} className="text-primary" />
          {t('editProfile')}
        </h2>

        {/* Status alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {t('fullName')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  disabled={saving}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60"
                />
                <User size={15} className="absolute left-3.5 top-3 text-gray-400" />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {t('email')}
                <span className="ml-1.5 text-[10px] font-normal text-gray-400">(read-only)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 outline-none cursor-not-allowed"
                />
                <Mail size={15} className="absolute left-3.5 top-3 text-gray-400" />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {t('state')}
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={saving}
                  className="w-full appearance-none border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-8 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60"
                >
                  <option value="">{t('selectState')}</option>
                  {LOCATIONS_DATA.map((loc) => (
                    <option key={loc.state} value={loc.state}>
                      {language === 'hi' ? loc.stateHi : loc.state}
                    </option>
                  ))}
                </select>
                <MapPin size={15} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {t('city')}
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={saving || !selectedState}
                  className="w-full appearance-none border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-8 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60"
                >
                  <option value="">{t('selectCity')}</option>
                  {availableCities.map((c) => (
                    <option key={c.nameEn} value={c.nameEn}>
                      {language === 'hi' ? c.nameHi : c.nameEn}
                    </option>
                  ))}
                </select>
                <MapPin size={15} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition-all shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {uploadingAvatar ? t('uploadingPhoto') : t('updatingProfile')}
                </span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t('saveChanges')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── PREFERENCES CARD ── */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-on-surface dark:text-white flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          Reading Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {t('language')}
                </p>
                <p className="text-[11px] text-gray-500">
                  {selectedLanguage === 'en' ? 'English' : 'हिंदी'}
                </p>
              </div>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'hi')}
              className="text-xs font-semibold p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          {/* Theme */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={18} className="text-primary flex-shrink-0" />
              ) : (
                <Sun size={18} className="text-primary flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Display Theme</p>
                <p className="text-[11px] text-gray-500 capitalize">{theme} Mode</p>
              </div>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="text-xs font-semibold p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── BOOKMARKS + SIGN OUT ── */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Link
          to="/saved"
          className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
        >
          <Bookmark size={16} />
          View {savedArticleIds.length} Saved {savedArticleIds.length === 1 ? 'Story' : 'Stories'}
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          {t('logout')}
        </button>
      </div>
    </div>
  );
};
