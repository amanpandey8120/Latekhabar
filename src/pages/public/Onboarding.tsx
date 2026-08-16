import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_CATEGORIES, LOCATIONS_DATA } from '../../lib/mockData';
import { Check, Sparkles, MapPin } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [selectedCats, setSelectedCats] = useState<string[]>(user?.preferredCategories || ['cat-1', 'cat-6']);
  const [selectedState, setSelectedState] = useState<string>(user?.state || 'Delhi');
  const [selectedCity, setSelectedCity] = useState<string>(user?.city || 'New Delhi');

  const toggleCat = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleFinish = () => {
    updateProfile({
      preferredCategories: selectedCats,
      state: selectedState,
      city: selectedCity,
    });
    navigate('/');
  };

  const currentLocation = LOCATIONS_DATA.find((l) => l.state === selectedState);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="text-center space-y-2">
        <span className="px-3 py-1 bg-red-100 dark:bg-red-950 text-primary rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
          <Sparkles size={14} /> Personalize Your Experience
        </span>
        <h1 className="text-3xl font-bold font-headline-md text-on-surface dark:text-white">
          Tailor Late Khabar To Your Interests
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Select topics and your primary city to receive custom news recommendations.
        </p>
      </div>

      {/* Step 1: Categories Selection */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-on-surface dark:text-white">1. Choose Topics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INITIAL_CATEGORIES.map((cat) => {
            const isSelected = selectedCats.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                className={`flex items-center justify-between p-3 rounded-lg text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'border-primary bg-red-50 dark:bg-red-950/40 text-primary dark:text-primary-fixed shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <span>{cat.nameEn}</span>
                {isSelected && <Check size={16} className="text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Location Selection */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-on-surface dark:text-white flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          2. Primary Location
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                const firstCity = LOCATIONS_DATA.find((l) => l.state === e.target.value)?.cities[0]?.nameEn || '';
                setSelectedCity(firstCity);
              }}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white outline-none focus:border-primary"
            >
              {LOCATIONS_DATA.map((loc) => (
                <option key={loc.state} value={loc.state} className="dark:bg-gray-800">
                  {loc.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white outline-none focus:border-primary"
            >
              {currentLocation?.cities.map((c) => (
                <option key={c.nameEn} value={c.nameEn} className="dark:bg-gray-800">
                  {c.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleFinish}
          className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container shadow-md transition-all"
        >
          Save & Launch Newsfeed
        </button>
      </div>
    </div>
  );
};
