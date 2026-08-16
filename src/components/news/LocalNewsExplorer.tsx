import React, { useState } from 'react';
import type { LocationData, Article } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ArticleCard } from './ArticleCard';
import { MapPin } from 'lucide-react';

interface LocalNewsExplorerProps {
  locations: LocationData[];
  articles: Article[];
}

export const LocalNewsExplorer: React.FC<LocalNewsExplorerProps> = ({ locations, articles }) => {
  const { language, t } = useLanguage();
  const [selectedState, setSelectedState] = useState<string>('Delhi');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const currentLocation = locations.find((l) => l.state === selectedState) || locations[0];

  const filteredArticles = articles.filter((art) => {
    if (art.state && art.state.toLowerCase() !== selectedState.toLowerCase()) return false;
    if (selectedCity && art.city && art.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="w-full bg-surface-container-low dark:bg-[#1c1c1c] rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <MapPin size={22} className="text-primary" />
          <h2 className="text-xl font-bold font-headline-md text-on-surface dark:text-white">
            {t('localCoverage')}
          </h2>
        </div>

        {/* State Tabs */}
        <div className="flex overflow-x-auto gap-2 hide-scrollbar">
          {locations.map((loc) => (
            <button
              key={loc.state}
              onClick={() => {
                setSelectedState(loc.state);
                setSelectedCity(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedState === loc.state
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {language === 'hi' ? loc.stateHi : loc.state}
            </button>
          ))}
        </div>
      </div>

      {/* City Chips */}
      {currentLocation && currentLocation.cities.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cities:</span>
          <button
            onClick={() => setSelectedCity(null)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              selectedCity === null
                ? 'bg-primary-container text-white font-bold'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {currentLocation.cities.map((city) => (
            <button
              key={city.nameEn}
              onClick={() => setSelectedCity(city.nameEn)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedCity === city.nameEn
                  ? 'bg-primary-container text-white font-bold'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {language === 'hi' ? city.nameHi : city.nameEn}
            </button>
          ))}
        </div>
      )}

      {/* Articles Feed */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
          No regional stories reported yet for {selectedCity || selectedState}.
        </div>
      )}
    </div>
  );
};
