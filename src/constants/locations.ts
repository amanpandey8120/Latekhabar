import type { LocationData } from '../types';

/**
 * Static location list for state and city regional news filtering.
 * Represents intentionally static geographical definitions for India.
 */
export const LOCATIONS_DATA: LocationData[] = [
  {
    state: 'Delhi',
    stateHi: 'दिल्ली',
    cities: [
      { nameEn: 'New Delhi', nameHi: 'नई दिल्ली' },
      { nameEn: 'North Delhi', nameHi: 'उत्तरी दिल्ली' },
      { nameEn: 'South Delhi', nameHi: 'दक्षिणी दिल्ली' },
    ],
  },
  {
    state: 'Maharashtra',
    stateHi: 'महाराष्ट्र',
    cities: [
      { nameEn: 'Mumbai', nameHi: 'मुंबई' },
      { nameEn: 'Pune', nameHi: 'पुणे' },
      { nameEn: 'Nagpur', nameHi: 'नागपुर' },
    ],
  },
  {
    state: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    cities: [
      { nameEn: 'Lucknow', nameHi: 'लखनऊ' },
      { nameEn: 'Varanasi', nameHi: 'वाराणसी' },
      { nameEn: 'Noida', nameHi: 'नोएडा' },
      { nameEn: 'Kanpur', nameHi: 'कानपुर' },
    ],
  },
  {
    state: 'Bihar',
    stateHi: 'बिहार',
    cities: [
      { nameEn: 'Patna', nameHi: 'पटना' },
      { nameEn: 'Gaya', nameHi: 'गया' },
      { nameEn: 'Muzaffarpur', nameHi: 'मुजफ्फरपुर' },
    ],
  },
  {
    state: 'Madhya Pradesh',
    stateHi: 'मध्य प्रदेश',
    cities: [
      { nameEn: 'Bhopal', nameHi: 'भोपाल' },
      { nameEn: 'Indore', nameHi: 'इंदौर' },
      { nameEn: 'Gwalior', nameHi: 'ग्वालियर' },
    ],
  },
];
