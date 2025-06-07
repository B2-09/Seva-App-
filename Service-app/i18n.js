// updated with async storage
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import gu from './locales/gu.json';
import mr from './locales/mr.json';

const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  gu: {
    translation: gu,
  },
  mr: {
    translation: mr,
  },
};

i18n
  .use(initReactI18next) // Removed ReactNativeLanguageDetector
  .init({
    resources,
    lng: 'en', // Default language before detection/load from storage
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;