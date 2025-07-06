import { createSignal, createMemo, createContext, useContext } from 'solid-js';
import type { ParentComponent } from 'solid-js';
import { en } from './en';
import { es } from './es';
import type { TranslationKeys } from './types';

// Supported languages
export type Language = 'en' | 'es';

// Translation data
const translations: Record<Language, TranslationKeys> = {
  en,
  es,
};

// I18n Context
interface I18nContextType {
  language: () => Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: () => TranslationKeys;
}

const I18nContext = createContext<I18nContextType>();

// Get nested object value by dot notation
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// I18n Provider Component
export const I18nProvider: ParentComponent = (props) => {
  // Default to Spanish as per CLAUDE.md instructions
  const [language, setLanguage] = createSignal<Language>('es');
  
  // Load saved language from localStorage
  const savedLang = localStorage.getItem('context-manager-language') as Language;
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    setLanguage(savedLang);
  }
  
  // Save language to localStorage when changed
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('context-manager-language', lang);
  };
  
  // Get current translations
  const currentTranslations = createMemo(() => translations[language()]);
  
  // Translation function
  const t = (key: string): string => {
    return getNestedValue(currentTranslations(), key);
  };
  
  const contextValue: I18nContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    translations: currentTranslations,
  };
  
  return I18nContext.Provider({
    value: contextValue,
    get children() {
      return props.children;
    }
  });
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
};

// Utility function to get available languages
export const getAvailableLanguages = () => {
  return [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  ];
};

// Export types and constants
export type { TranslationKeys };
export const DEFAULT_LANGUAGE: Language = 'es';