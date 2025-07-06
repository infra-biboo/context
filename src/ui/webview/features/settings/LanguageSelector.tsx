import { Component, For } from 'solid-js';
import { Globe, Check } from 'lucide-solid';
import { useTranslation, getAvailableLanguages, type Language } from '../../i18n';
import ContentCard from '../../components/ContentCard';

const LanguageSelector: Component = () => {
  const { t, language, setLanguage } = useTranslation();
  const availableLanguages = getAvailableLanguages();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <ContentCard icon={<Globe size={20} />} title={t('settings.language.title')}>
      <div class="language-settings">
        <div class="setting-group">
          <label class="setting-label">
            {t('settings.language.label')}
          </label>
          <div class="language-options">
            <For each={availableLanguages}>
              {(lang) => (
                <button
                  class={`language-option ${language() === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span class="language-flag">{lang.flag}</span>
                  <span class="language-name">{lang.name}</span>
                  {language() === lang.code && (
                    <span class="language-current"><Check size={16} /></span>
                  )}
                </button>
              )}
            </For>
          </div>
        </div>
        
        <div class="current-language-info">
          <small class="language-info-text">
            {t('settings.language.current')}: {availableLanguages.find(l => l.code === language())?.name}
          </small>
        </div>
      </div>
    </ContentCard>
  );
};

export default LanguageSelector;